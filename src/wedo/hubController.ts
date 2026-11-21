import {
  LogEntry,
  MotionSensorMode,
  PortSelection,
  TelemetryPoint,
  TiltSensorMode,
  WeDoController,
  WeDoDeviceType,
  WeDoHubState,
} from '../types/wedo';
import { simPiezo } from './audio';
import {
  buildInputFormatCommand,
  buildLedIndexCommand,
  buildLedRgbCommand,
  buildMotorPowerCommand,
  buildMotorStopCommand,
  buildPiezoStopCommand,
  buildPiezoToneCommand,
  DEFAULT_PORTS,
  deriveTiltDirection,
  DEVICE_TYPE_IDS,
  INPUT_UNIT,
  LEGO_COLORS,
  parseAttachedIO,
  parseMotionValue,
  parseTiltValue,
  WEDO_UUIDS,
} from './protocol';

export function createInitialHubState(): WeDoHubState {
  return {
    connectionMode: 'disconnected',
    hubName: 'WeDo 2.0 Hub',
    battery: null,
    voltage: null,
    current: null,
    buttonPressed: false,
    ports: {
      A: { connectId: DEFAULT_PORTS.A, label: 'A', deviceType: 'none' },
      B: { connectId: DEFAULT_PORTS.B, label: 'B', deviceType: 'none' },
    },
    motorPower: { A: 0, B: 0 },
    motorBraked: { A: false, B: false },
    ledColor: { r: 37, g: 99, b: 235 },
    ledMode: 'index',
    activeTone: null,
    motionMode: 'detect',
    distance: 10.0,
    motionCount: 0,
    tiltMode: 'angle',
    tiltX: 0,
    tiltY: 0,
    tiltDirection: 'flat',
    crashCount: 0,
    lastError: null,
  };
}

type StateListener = (state: WeDoHubState) => void;
type LogListener = (entry: LogEntry) => void;
type TelemetryListener = (point: TelemetryPoint) => void;

export class WeDoHubManager implements WeDoController {
  private state: WeDoHubState = createInitialHubState();
  private stateListeners = new Set<StateListener>();
  private logListeners = new Set<LogListener>();
  private telemetryListeners = new Set<TelemetryListener>();

  // Bluetooth GATT handles
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private inputCmdChar: BluetoothRemoteGATTCharacteristic | null = null;
  private outputCmdChar: BluetoothRemoteGATTCharacteristic | null = null;
  private turnOffChar: BluetoothRemoteGATTCharacteristic | null = null;

  // Dynamic internal port IDs (discovered via 0x1527, fallback to WeDo 2.0 defaults)
  private piezoPortId: number = DEFAULT_PORTS.PIEZO;
  private rgbPortId: number = DEFAULT_PORTS.RGB_LED;
  private voltagePortId: number = DEFAULT_PORTS.VOLTAGE;
  private currentPortId: number = DEFAULT_PORTS.CURRENT;

  // Serialized GATT write queue to prevent "GATT operation already in progress"
  private writeQueue: Promise<void> = Promise.resolve();
  private telemetryTimer: number | null = null;
  private logSeq = 0;

  getState(): WeDoHubState {
    return this.state;
  }

  subscribeState(fn: StateListener): () => void {
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  }

  subscribeLogs(fn: LogListener): () => void {
    this.logListeners.add(fn);
    return () => this.logListeners.delete(fn);
  }

  subscribeTelemetry(fn: TelemetryListener): () => void {
    this.telemetryListeners.add(fn);
    return () => this.telemetryListeners.delete(fn);
  }

  emitLog(level: LogEntry['level'], message: string): void {
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);
    const entry: LogEntry = {
      id: `${now.getTime()}-${++this.logSeq}`,
      time,
      level,
      message,
    };
    this.logListeners.forEach((fn) => fn(entry));
  }

  private setState(patch: Partial<WeDoHubState> | ((prev: WeDoHubState) => WeDoHubState)): void {
    this.state = typeof patch === 'function' ? patch(this.state) : { ...this.state, ...patch };
    this.stateListeners.forEach((fn) => fn(this.state));
  }

  private startTelemetryLoop(): void {
    this.stopTelemetryLoop();
    this.telemetryTimer = window.setInterval(() => {
      if (this.state.connectionMode === 'disconnected') return;
      const activeMotorPower =
        this.state.ports.A.deviceType === 'motor'
          ? this.state.motorPower.A
          : this.state.ports.B.deviceType === 'motor'
            ? this.state.motorPower.B
            : this.state.motorPower.A;
      const point: TelemetryPoint = {
        t: Date.now(),
        distance: this.state.distance,
        tiltX: this.state.tiltX,
        tiltY: this.state.tiltY,
        motorPower: activeMotorPower,
      };
      this.telemetryListeners.forEach((fn) => fn(point));
    }, 150);
  }

  private stopTelemetryLoop(): void {
    if (this.telemetryTimer !== null) {
      window.clearInterval(this.telemetryTimer);
      this.telemetryTimer = null;
    }
  }

  private enqueueWrite(
    char: BluetoothRemoteGATTCharacteristic | null,
    payload: Uint8Array
  ): Promise<void> {
    if (!char) return Promise.resolve();
    const task = this.writeQueue.then(async () => {
      if (!this.server?.connected) return;
      try {
        await char.writeValue(payload as unknown as BufferSource);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.emitLog('warn', `BLE write warning: ${msg}`);
      }
    });
    this.writeQueue = task.catch(() => {});
    return task;
  }

  async connectBluetooth(): Promise<void> {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      const msg = 'Web Bluetooth API is not supported in this browser. Use Chrome or Edge.';
      this.setState({ lastError: msg });
      this.emitLog('error', msg);
      throw new Error(msg);
    }

    if (this.state.connectionMode === 'simulator') {
      await this.disconnect();
    }

    this.setState({ connectionMode: 'connecting', lastError: null });
    this.emitLog('info', 'Scanning for LEGO WeDo 2.0 Smart Hub...');

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [WEDO_UUIDS.HUB_SERVICE] }],
        optionalServices: [WEDO_UUIDS.IO_SERVICE, WEDO_UUIDS.BATTERY_SERVICE],
      });

      this.device = device;
      device.addEventListener('gattserverdisconnected', this.handleGattDisconnected);

      const server = await device.gatt!.connect();
      this.server = server;

      const hubService = await server.getPrimaryService(WEDO_UUIDS.HUB_SERVICE);
      const ioService = await server.getPrimaryService(WEDO_UUIDS.IO_SERVICE);

      // Output & Input Command characteristics
      this.inputCmdChar = await ioService.getCharacteristic(WEDO_UUIDS.INPUT_COMMAND);
      this.outputCmdChar = await ioService.getCharacteristic(WEDO_UUIDS.OUTPUT_COMMAND);

      // Optional Turn Off characteristic
      try {
        this.turnOffChar = await hubService.getCharacteristic(WEDO_UUIDS.TURN_OFF);
      } catch {
        this.turnOffChar = null;
      }

      // Read Hub Name
      let hubName = device.name || 'WeDo 2.0 Hub';
      try {
        const nameChar = await hubService.getCharacteristic(WEDO_UUIDS.HUB_NAME);
        const val = await nameChar.readValue();
        const decoded = new TextDecoder().decode(val.buffer).replace(/\0/g, '').trim();
        if (decoded) hubName = decoded;
      } catch {
        // fallback to BLE device name
      }

      // Subscribe to Sensor Value notifications (0x1560)
      const sensorValueChar = await ioService.getCharacteristic(WEDO_UUIDS.SENSOR_VALUE);
      sensorValueChar.addEventListener('characteristicvaluechanged', this.handleSensorValue);
      await sensorValueChar.startNotifications();

      // Subscribe to Attached I/O notifications (0x1527)
      const attachedIoChar = await hubService.getCharacteristic(WEDO_UUIDS.ATTACHED_IO);
      attachedIoChar.addEventListener('characteristicvaluechanged', this.handleAttachedIO);
      await attachedIoChar.startNotifications();

      // Subscribe to Hub Button notifications (0x1526)
      try {
        const buttonChar = await hubService.getCharacteristic(WEDO_UUIDS.BUTTON);
        buttonChar.addEventListener('characteristicvaluechanged', this.handleButtonChanged);
        await buttonChar.startNotifications();
      } catch {
        // non-fatal
      }

      // Battery Service
      let battery: number | null = null;
      try {
        const batteryService = await server.getPrimaryService(WEDO_UUIDS.BATTERY_SERVICE);
        const battChar = await batteryService.getCharacteristic(WEDO_UUIDS.BATTERY_LEVEL);
        const bVal = await battChar.readValue();
        battery = bVal.getUint8(0);
        battChar.addEventListener('characteristicvaluechanged', (ev: Event) => {
          const target = ev.target as BluetoothRemoteGATTCharacteristic;
          if (target.value) {
            this.setState({ battery: target.value.getUint8(0) });
          }
        });
        await battChar.startNotifications();
      } catch {
        // Battery service optional
      }

      this.setState({
        ...createInitialHubState(),
        connectionMode: 'bluetooth',
        hubName,
        battery,
      });

      this.startTelemetryLoop();
      this.emitLog('info', `Connected to ${hubName} (Battery: ${battery ?? '?'}%)`);

      // Switch RGB LED to Absolute RGB mode (mode 1) and set signature blue
      await this.configureRgbMode('rgb');
      await this.setLedRgb(37, 99, 235);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setState({ connectionMode: 'disconnected', lastError: msg });
      this.emitLog('error', `Bluetooth connection failed: ${msg}`);
      throw err;
    }
  }

  connectSimulator(): void {
    if (this.server?.connected) {
      this.server.disconnect();
    }
    this.setState({
      ...createInitialHubState(),
      connectionMode: 'simulator',
      hubName: 'WeDo 2.0 Simulator',
      battery: 94,
      voltage: 3120,
      current: 45,
      ports: {
        A: { connectId: DEFAULT_PORTS.A, label: 'A', deviceType: 'motor' },
        B: { connectId: DEFAULT_PORTS.B, label: 'B', deviceType: 'motion' },
      },
      distance: 6.5,
      tiltX: 0,
      tiltY: 0,
      tiltDirection: 'flat',
    });
    this.startTelemetryLoop();
    this.emitLog('info', 'Simulator connected (Port A: Motor, Port B: Motion Sensor)');
  }

  async disconnect(): Promise<void> {
    this.stopTelemetryLoop();
    simPiezo.stop();

    if (this.state.connectionMode === 'bluetooth' && this.server?.connected) {
      try {
        await this.stopMotor(false, 'A');
        await this.stopMotor(false, 'B');
      } catch {
        // ignore during disconnect
      }
      this.server.disconnect();
    }

    if (this.device) {
      this.device.removeEventListener('gattserverdisconnected', this.handleGattDisconnected);
    }
    this.device = null;
    this.server = null;
    this.inputCmdChar = null;
    this.outputCmdChar = null;
    this.turnOffChar = null;

    this.setState(createInitialHubState());
    this.emitLog('info', 'Disconnected from WeDo 2.0 Hub.');
  }

  async powerOffHub(): Promise<void> {
    if (this.state.connectionMode === 'bluetooth' && this.turnOffChar) {
      await this.enqueueWrite(this.turnOffChar, new Uint8Array([0x01]));
      this.emitLog('info', 'Sent power-off command to WeDo 2.0 Hub.');
    }
    await this.disconnect();
  }

  private handleGattDisconnected = (): void => {
    this.stopTelemetryLoop();
    this.server = null;
    this.inputCmdChar = null;
    this.outputCmdChar = null;
    this.turnOffChar = null;
    this.setState({ connectionMode: 'disconnected', motorPower: { A: 0, B: 0 } });
    this.emitLog('warn', 'WeDo 2.0 Hub disconnected unexpectedly.');
  };

  private handleButtonChanged = (event: Event): void => {
    const char = event.target as BluetoothRemoteGATTCharacteristic;
    if (!char.value || char.value.byteLength < 1) return;
    const pressed = char.value.getUint8(0) === 1;
    this.setState({ buttonPressed: pressed });
    if (pressed) {
      this.emitLog('sensor', 'Hub button pressed');
    }
  };

  private handleAttachedIO = (event: Event): void => {
    const char = event.target as BluetoothRemoteGATTCharacteristic;
    if (!char.value) return;
    const parsed = parseAttachedIO(char.value);
    if (!parsed) return;

    const { connectId, attached, deviceType } = parsed;

    // Track internal hub devices dynamically
    if (attached) {
      if (deviceType === 'piezo') this.piezoPortId = connectId;
      if (deviceType === 'rgb') this.rgbPortId = connectId;
      if (deviceType === 'voltage') this.voltagePortId = connectId;
      if (deviceType === 'current') this.currentPortId = connectId;
    }

    // External Ports A (1) and B (2)
    if (connectId === DEFAULT_PORTS.A || connectId === DEFAULT_PORTS.B) {
      const label: 'A' | 'B' = connectId === DEFAULT_PORTS.A ? 'A' : 'B';
      const newType: WeDoDeviceType = attached ? deviceType : 'none';
      this.setState((prev) => ({
        ...prev,
        ports: {
          ...prev.ports,
          [label]: { connectId, label, deviceType: newType },
        },
        motorPower:
          !attached || newType !== 'motor'
            ? { ...prev.motorPower, [label]: 0 }
            : prev.motorPower,
      }));

      this.emitLog(
        'sensor',
        attached ? `Port ${label}: attached ${deviceType}` : `Port ${label}: detached`
      );

      if (attached && deviceType === 'motion') {
        void this.configureMotionSensor(connectId, this.state.motionMode);
      } else if (attached && deviceType === 'tilt') {
        void this.configureTiltSensor(connectId, this.state.tiltMode);
      }
    }
  };

  private handleSensorValue = (event: Event): void => {
    const char = event.target as BluetoothRemoteGATTCharacteristic;
    if (!char.value || char.value.byteLength < 3) return;
    const data = char.value;
    const connectId = data.getUint8(1);

    const portInfo =
      connectId === this.state.ports.A.connectId
        ? this.state.ports.A
        : connectId === this.state.ports.B.connectId
          ? this.state.ports.B
          : null;

    if (portInfo?.deviceType === 'motion') {
      const parsed = parseMotionValue(data, this.state.motionMode);
      if (parsed.distance !== undefined) {
        this.setState({ distance: parsed.distance });
      } else if (parsed.count !== undefined) {
        this.setState({ motionCount: parsed.count });
      }
      return;
    }

    if (portInfo?.deviceType === 'tilt') {
      const parsed = parseTiltValue(data, this.state.tiltMode);
      this.setState((prev) => ({
        ...prev,
        tiltX: parsed.x !== undefined ? parsed.x : prev.tiltX,
        tiltY: parsed.y !== undefined ? parsed.y : prev.tiltY,
        tiltDirection: parsed.direction !== undefined ? parsed.direction : prev.tiltDirection,
        crashCount:
          parsed.crashDelta !== undefined && parsed.crashDelta > 0
            ? prev.crashCount + 1
            : prev.crashCount,
      }));
      return;
    }

    if (connectId === this.voltagePortId && data.byteLength >= 6) {
      const mv = Math.round(data.getFloat32(2, true));
      if (Number.isFinite(mv)) this.setState({ voltage: mv });
    } else if (connectId === this.currentPortId && data.byteLength >= 6) {
      const ma = Math.round(data.getFloat32(2, true));
      if (Number.isFinite(ma)) this.setState({ current: ma });
    }
  };

  private async configureMotionSensor(connectId: number, mode: MotionSensorMode): Promise<void> {
    const modeByte = mode === 'detect' ? 0x00 : 0x01;
    // SI unit (0x02) gives continuous IEEE-754 float distance 0.0..10.0 on WeDo 2.0 Motion Sensor!
    const cmd = buildInputFormatCommand(
      connectId,
      DEVICE_TYPE_IDS.MOTION,
      modeByte,
      INPUT_UNIT.SI,
      true,
      1
    );
    await this.enqueueWrite(this.inputCmdChar, cmd);
  }

  private async configureTiltSensor(connectId: number, mode: TiltSensorMode): Promise<void> {
    const modeByte = mode === 'angle' ? 0x00 : mode === 'tilt' ? 0x01 : 0x02;
    // Raw unit (0x00) gives crisp signed Int8 X/Y degrees (-45..45), WeDo enum, or 3-byte crash counters
    const cmd = buildInputFormatCommand(
      connectId,
      DEVICE_TYPE_IDS.TILT,
      modeByte,
      INPUT_UNIT.RAW,
      true,
      1
    );
    await this.enqueueWrite(this.inputCmdChar, cmd);
  }

  private async configureRgbMode(mode: 'index' | 'rgb'): Promise<void> {
    if (this.state.ledMode === mode && this.state.connectionMode !== 'bluetooth') return;
    const modeByte = mode === 'rgb' ? 0x01 : 0x00;
    const cmd = buildInputFormatCommand(
      this.rgbPortId,
      DEVICE_TYPE_IDS.RGB_LED,
      modeByte,
      INPUT_UNIT.RAW,
      false,
      1
    );
    await this.enqueueWrite(this.inputCmdChar, cmd);
    this.setState({ ledMode: mode });
  }

  private resolveMotorPort(port: PortSelection = 'auto'): 'A' | 'B' {
    if (port === 'A' || port === 'B') return port;
    if (this.state.ports.A.deviceType === 'motor') return 'A';
    if (this.state.ports.B.deviceType === 'motor') return 'B';
    return 'A';
  }

  private findSensorPort(type: 'motion' | 'tilt'): number | null {
    if (this.state.ports.A.deviceType === type) return this.state.ports.A.connectId;
    if (this.state.ports.B.deviceType === type) return this.state.ports.B.connectId;
    return null;
  }

  async setMotorPower(power: number, port: PortSelection = 'auto'): Promise<void> {
    const target = this.resolveMotorPort(port);
    const clamped = Math.max(-100, Math.min(100, Math.round(power)));
    const connectId = target === 'A' ? DEFAULT_PORTS.A : DEFAULT_PORTS.B;

    this.setState((prev) => ({
      ...prev,
      motorPower: { ...prev.motorPower, [target]: clamped },
      motorBraked: { ...prev.motorBraked, [target]: false },
    }));

    if (this.state.connectionMode === 'bluetooth') {
      await this.enqueueWrite(this.outputCmdChar, buildMotorPowerCommand(connectId, clamped));
    }
  }

  async stopMotor(brake = true, port: PortSelection = 'auto'): Promise<void> {
    const target = this.resolveMotorPort(port);
    const connectId = target === 'A' ? DEFAULT_PORTS.A : DEFAULT_PORTS.B;

    this.setState((prev) => ({
      ...prev,
      motorPower: { ...prev.motorPower, [target]: 0 },
      motorBraked: { ...prev.motorBraked, [target]: brake },
    }));

    if (this.state.connectionMode === 'bluetooth') {
      await this.enqueueWrite(this.outputCmdChar, buildMotorStopCommand(connectId, brake));
    }
  }

  async setLedRgb(r: number, g: number, b: number): Promise<void> {
    const color = {
      r: Math.max(0, Math.min(255, Math.round(r))),
      g: Math.max(0, Math.min(255, Math.round(g))),
      b: Math.max(0, Math.min(255, Math.round(b))),
    };
    this.setState({ ledColor: color });

    if (this.state.connectionMode === 'bluetooth') {
      if (this.state.ledMode !== 'rgb') {
        await this.configureRgbMode('rgb');
      }
      await this.enqueueWrite(
        this.outputCmdChar,
        buildLedRgbCommand(this.rgbPortId, color.r, color.g, color.b)
      );
    }
  }

  async setLedIndex(index: number): Promise<void> {
    const idx = Math.max(0, Math.min(10, Math.round(index)));
    const preset = LEGO_COLORS[idx] ?? LEGO_COLORS[0];
    this.setState({ ledColor: preset.rgb });

    if (this.state.connectionMode === 'bluetooth') {
      if (this.state.ledMode !== 'index') {
        await this.configureRgbMode('index');
      }
      await this.enqueueWrite(this.outputCmdChar, buildLedIndexCommand(this.rgbPortId, idx));
    }
  }

  async playTone(freqHz: number, durationMs: number): Promise<void> {
    const f = Math.max(50, Math.min(5000, Math.round(freqHz)));
    const d = Math.max(20, Math.min(10000, Math.round(durationMs)));

    this.setState({ activeTone: { freq: f, until: Date.now() + d } });
    window.setTimeout(() => {
      if (this.state.activeTone && Date.now() >= this.state.activeTone.until - 10) {
        this.setState({ activeTone: null });
      }
    }, d + 30);

    if (this.state.connectionMode === 'bluetooth') {
      await this.enqueueWrite(this.outputCmdChar, buildPiezoToneCommand(this.piezoPortId, f, d));
    } else if (this.state.connectionMode === 'simulator') {
      simPiezo.playTone(f, d);
    }
  }

  async stopTone(): Promise<void> {
    this.setState({ activeTone: null });
    simPiezo.stop();
    if (this.state.connectionMode === 'bluetooth') {
      await this.enqueueWrite(this.outputCmdChar, buildPiezoStopCommand(this.piezoPortId));
    }
  }

  async setMotionMode(mode: MotionSensorMode): Promise<void> {
    this.setState({ motionMode: mode });
    if (this.state.connectionMode === 'bluetooth') {
      const portId = this.findSensorPort('motion');
      if (portId !== null) {
        await this.configureMotionSensor(portId, mode);
      }
    }
    this.emitLog('sensor', `Motion sensor mode -> ${mode}`);
  }

  async resetMotionCount(): Promise<void> {
    this.setState({ motionCount: 0 });
    if (this.state.connectionMode === 'bluetooth' && this.state.motionMode === 'count') {
      const portId = this.findSensorPort('motion');
      if (portId !== null) {
        // Re-sending input format mode 1 resets the hardware counter on WeDo 2.0
        await this.configureMotionSensor(portId, 'count');
      }
    }
  }

  async setTiltMode(mode: TiltSensorMode): Promise<void> {
    this.setState({ tiltMode: mode });
    if (this.state.connectionMode === 'bluetooth') {
      const portId = this.findSensorPort('tilt');
      if (portId !== null) {
        await this.configureTiltSensor(portId, mode);
      }
    }
    this.emitLog('sensor', `Tilt sensor mode -> ${mode}`);
  }

  async resetCrashCount(): Promise<void> {
    this.setState({ crashCount: 0 });
    if (this.state.connectionMode === 'bluetooth' && this.state.tiltMode === 'crash') {
      const portId = this.findSensorPort('tilt');
      if (portId !== null) {
        await this.configureTiltSensor(portId, 'crash');
      }
    }
  }

  // --- Simulator interactive setters ---
  setSimDistance(value: number): void {
    const clamped = Math.max(0, Math.min(10, Math.round(value * 10) / 10));
    const prev = this.state.distance;
    // Auto-increment counter if crossing close threshold (< 3.0) in simulator
    const crossedClose = prev >= 3.0 && clamped < 3.0;
    this.setState((s) => ({
      ...s,
      distance: clamped,
      motionCount: crossedClose ? s.motionCount + 1 : s.motionCount,
    }));
  }

  triggerSimObjectPass(): void {
    this.setState((s) => ({ ...s, motionCount: s.motionCount + 1 }));
    this.emitLog('sensor', `Simulator: object passed (count = ${this.state.motionCount})`);
  }

  setSimTilt(x: number, y: number): void {
    const cx = Math.max(-45, Math.min(45, Math.round(x)));
    const cy = Math.max(-45, Math.min(45, Math.round(y)));
    this.setState({
      tiltX: cx,
      tiltY: cy,
      tiltDirection: deriveTiltDirection(cx, cy),
    });
  }

  triggerSimCrash(): void {
    this.setState((s) => ({ ...s, crashCount: s.crashCount + 1 }));
    this.emitLog('sensor', `Simulator: crash/bump detected (total = ${this.state.crashCount})`);
  }

  setSimButton(pressed: boolean): void {
    this.setState({ buttonPressed: pressed });
    if (pressed) {
      this.emitLog('sensor', 'Simulator: hub button pressed');
    }
  }

  setSimPortDevice(port: 'A' | 'B', device: 'none' | 'motor' | 'motion' | 'tilt'): void {
    this.setState((prev) => ({
      ...prev,
      ports: {
        ...prev.ports,
        [port]: {
          ...prev.ports[port],
          deviceType: device,
        },
      },
      motorPower: device !== 'motor' ? { ...prev.motorPower, [port]: 0 } : prev.motorPower,
    }));
    this.emitLog('sensor', `Simulator Port ${port} -> ${device}`);
  }
}

export const wedoManager = new WeDoHubManager();

export type Language = 'pl' | 'en';

export type AppMode = 'simple' | 'blockly' | 'python' | 'control';

export type ConnectionMode = 'disconnected' | 'connecting' | 'bluetooth' | 'simulator';

export type WeDoDeviceType =
  | 'none'
  | 'motor'
  | 'motion'
  | 'tilt'
  | 'voltage'
  | 'current'
  | 'piezo'
  | 'rgb'
  | 'unknown';

export type MotionSensorMode = 'detect' | 'count';
export type TiltSensorMode = 'angle' | 'tilt' | 'crash';

export type TiltDirection = 'flat' | 'up' | 'down' | 'left' | 'right' | 'unknown';

export type PortSelection = 'auto' | 'A' | 'B';

export interface PortInfo {
  connectId: number;
  label: 'A' | 'B';
  deviceType: WeDoDeviceType;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface TelemetryPoint {
  t: number; // timestamp ms
  distance: number;
  tiltX: number;
  tiltY: number;
  motorPower: number;
}

export interface WeDoHubState {
  connectionMode: ConnectionMode;
  hubName: string;
  battery: number | null; // 0..100
  voltage: number | null; // mV
  current: number | null; // mA
  buttonPressed: boolean;
  ports: {
    A: PortInfo;
    B: PortInfo;
  };
  motorPower: {
    A: number; // -100..100
    B: number; // -100..100
  };
  motorBraked: {
    A: boolean;
    B: boolean;
  };
  ledColor: RGBColor;
  ledMode: 'index' | 'rgb';
  activeTone: { freq: number; until: number } | null;
  motionMode: MotionSensorMode;
  distance: number; // 0.0..10.0 float
  motionCount: number;
  tiltMode: TiltSensorMode;
  tiltX: number; // -45..45 degrees
  tiltY: number; // -45..45 degrees
  tiltDirection: TiltDirection;
  crashCount: number;
  lastError: string | null;
}

export interface LogEntry {
  id: string;
  time: string;
  level: 'info' | 'warn' | 'error' | 'sensor' | 'python';
  message: string;
}

export interface WeDoController {
  connectBluetooth(): Promise<void>;
  connectSimulator(): void;
  disconnect(): Promise<void>;
  powerOffHub(): Promise<void>;
  setMotorPower(power: number, port?: PortSelection): Promise<void>;
  stopMotor(brake?: boolean, port?: PortSelection): Promise<void>;
  setLedRgb(r: number, g: number, b: number): Promise<void>;
  setLedIndex(index: number): Promise<void>;
  playTone(freqHz: number, durationMs: number): Promise<void>;
  stopTone(): Promise<void>;
  setMotionMode(mode: MotionSensorMode): Promise<void>;
  resetMotionCount(): Promise<void>;
  setTiltMode(mode: TiltSensorMode): Promise<void>;
  resetCrashCount(): Promise<void>;
  // Simulator-only controls
  setSimDistance(value: number): void;
  triggerSimObjectPass(): void;
  setSimTilt(x: number, y: number): void;
  triggerSimCrash(): void;
  setSimButton(pressed: boolean): void;
  setSimPortDevice(port: 'A' | 'B', device: 'none' | 'motor' | 'motion' | 'tilt'): void;
}

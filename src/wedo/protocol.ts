import {
  MotionSensorMode,
  RGBColor,
  TiltDirection,
  TiltSensorMode,
  WeDoDeviceType,
} from '../types/wedo';

/** Official LEGO WeDo 2.0 BLE GATT Service & Characteristic UUIDs */
export const WEDO_UUIDS = {
  HUB_SERVICE: '00001523-1212-efde-1523-785feabcd123',
  IO_SERVICE: '00004f0e-1212-efde-1523-785feabcd123',
  BATTERY_SERVICE: '0000180f-0000-1000-8000-00805f9b34fb',

  HUB_NAME: '00001524-1212-efde-1523-785feabcd123',
  BUTTON: '00001526-1212-efde-1523-785feabcd123',
  ATTACHED_IO: '00001527-1212-efde-1523-785feabcd123',
  LOW_VOLTAGE_ALERT: '00001528-1212-efde-1523-785feabcd123',
  HIGH_CURRENT_ALERT: '00001529-1212-efde-1523-785feabcd123',
  TURN_OFF: '0000152b-1212-efde-1523-785feabcd123',

  SENSOR_VALUE: '00001560-1212-efde-1523-785feabcd123',
  VALUE_FORMAT: '00001561-1212-efde-1523-785feabcd123',
  INPUT_COMMAND: '00001563-1212-efde-1523-785feabcd123',
  OUTPUT_COMMAND: '00001565-1212-efde-1523-785feabcd123',

  BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',
} as const;

export const DEVICE_TYPE_IDS = {
  MOTOR: 0x01,
  VOLTAGE: 0x14,
  CURRENT: 0x15,
  PIEZO: 0x16,
  RGB_LED: 0x17,
  TILT: 0x22,
  MOTION: 0x23,
} as const;

export const DEFAULT_PORTS = {
  A: 1,
  B: 2,
  CURRENT: 3,
  VOLTAGE: 4,
  PIEZO: 5,
  RGB_LED: 6,
} as const;

export const INPUT_UNIT = {
  RAW: 0x00,
  PERCENTAGE: 0x01,
  SI: 0x02,
} as const;

export const LEGO_COLORS: ReadonlyArray<{
  index: number;
  namePl: string;
  nameEn: string;
  hex: string;
  rgb: RGBColor;
}> = [
  { index: 0, namePl: 'Wyłączony', nameEn: 'Off', hex: '#1e293b', rgb: { r: 0, g: 0, b: 0 } },
  { index: 1, namePl: 'Różowy', nameEn: 'Pink', hex: '#ec4899', rgb: { r: 236, g: 72, b: 153 } },
  { index: 2, namePl: 'Fioletowy', nameEn: 'Purple', hex: '#9333ea', rgb: { r: 147, g: 51, b: 234 } },
  { index: 3, namePl: 'Niebieski', nameEn: 'Blue', hex: '#2563eb', rgb: { r: 37, g: 99, b: 235 } },
  { index: 4, namePl: 'Błękitny', nameEn: 'Sky Blue', hex: '#38bdf8', rgb: { r: 56, g: 189, b: 248 } },
  { index: 5, namePl: 'Turkusowy', nameEn: 'Teal', hex: '#14b8a6', rgb: { r: 20, g: 184, b: 166 } },
  { index: 6, namePl: 'Zielony', nameEn: 'Green', hex: '#22c55e', rgb: { r: 34, g: 197, b: 94 } },
  { index: 7, namePl: 'Żółty', nameEn: 'Yellow', hex: '#eab308', rgb: { r: 234, g: 179, b: 8 } },
  { index: 8, namePl: 'Pomarańczowy', nameEn: 'Orange', hex: '#f97316', rgb: { r: 249, g: 115, b: 22 } },
  { index: 9, namePl: 'Czerwony', nameEn: 'Red', hex: '#ef4444', rgb: { r: 239, g: 68, b: 68 } },
  { index: 10, namePl: 'Biały', nameEn: 'White', hex: '#f8fafc', rgb: { r: 255, g: 255, b: 255 } },
];

export const NOTE_FREQUENCIES: Record<string, number> = {
  C4: 262,
  'C#4': 277,
  D4: 294,
  'D#4': 311,
  E4: 330,
  F4: 349,
  'F#4': 370,
  G4: 392,
  'G#4': 415,
  A4: 440,
  'A#4': 466,
  B4: 494,
  C5: 523,
  'C#5': 554,
  D5: 587,
  'D#5': 622,
  E5: 659,
  F5: 698,
  'F#5': 740,
  G5: 784,
  'G#5': 831,
  A5: 880,
  'A#5': 932,
  B5: 988,
  C6: 1047,
};

export const MELODIES: Record<
  string,
  { namePl: string; nameEn: string; notes: Array<[number, number, number?]> }
> = {
  startup: {
    namePl: 'Start (Fanfara)',
    nameEn: 'Startup Fanfare',
    notes: [
      [523, 140],
      [659, 140],
      [784, 140],
      [1047, 320],
    ],
  },
  alarm: {
    namePl: 'Alarm zbliżeniowy',
    nameEn: 'Proximity Alarm',
    notes: [
      [880, 150, 60],
      [660, 150, 60],
      [880, 150, 60],
      [660, 150, 60],
    ],
  },
  success: {
    namePl: 'Sukces',
    nameEn: 'Success',
    notes: [
      [587, 120],
      [740, 120],
      [880, 260],
    ],
  },
  starwars: {
    namePl: 'Marsz kosmiczny',
    nameEn: 'Space March',
    notes: [
      [440, 320, 60],
      [440, 320, 60],
      [440, 320, 60],
      [349, 230, 40],
      [523, 110, 40],
      [440, 350, 60],
    ],
  },
  mario: {
    namePl: 'Monetka',
    nameEn: 'Coin Pickup',
    notes: [
      [988, 90],
      [1319, 280],
    ],
  },
};

export function deviceTypeFromByte(byte: number): WeDoDeviceType {
  switch (byte) {
    case DEVICE_TYPE_IDS.MOTOR:
      return 'motor';
    case DEVICE_TYPE_IDS.MOTION:
      return 'motion';
    case DEVICE_TYPE_IDS.TILT:
      return 'tilt';
    case DEVICE_TYPE_IDS.VOLTAGE:
      return 'voltage';
    case DEVICE_TYPE_IDS.CURRENT:
      return 'current';
    case DEVICE_TYPE_IDS.PIEZO:
      return 'piezo';
    case DEVICE_TYPE_IDS.RGB_LED:
      return 'rgb';
    default:
      return 'unknown';
  }
}

/** Build Input Format Command (characteristic 0x1563) */
export function buildInputFormatCommand(
  connectId: number,
  deviceTypeByte: number,
  mode: number,
  unit: number,
  notificationsEnabled = true,
  delta = 1
): Uint8Array {
  const buf = new ArrayBuffer(11);
  const view = new DataView(buf);
  view.setUint8(0, 0x01); // Command ID: Input Format
  view.setUint8(1, 0x02); // Command Type: Write
  view.setUint8(2, connectId);
  view.setUint8(3, deviceTypeByte);
  view.setUint8(4, mode);
  view.setUint32(5, delta, true); // Delta interval (little-endian)
  view.setUint8(9, unit);
  view.setUint8(10, notificationsEnabled ? 0x01 : 0x00);
  return new Uint8Array(buf);
}

/** Build Motor Output Command (characteristic 0x1565) */
export function buildMotorPowerCommand(connectId: number, power: number): Uint8Array {
  const clamped = Math.max(-100, Math.min(100, Math.round(power)));
  const powerByte = clamped < 0 ? 256 + clamped : clamped;
  return new Uint8Array([connectId, 0x01, 0x01, powerByte]);
}

/** Build Motor Brake (0x7F) or Drift (0x00) Command */
export function buildMotorStopCommand(connectId: number, brake: boolean): Uint8Array {
  return new Uint8Array([connectId, 0x01, 0x01, brake ? 0x7f : 0x00]);
}

/** Build Piezo Play Tone Command (characteristic 0x1565) */
export function buildPiezoToneCommand(
  connectId: number,
  freqHz: number,
  durationMs: number
): Uint8Array {
  const f = Math.max(0, Math.min(65535, Math.round(freqHz)));
  const d = Math.max(0, Math.min(65535, Math.round(durationMs)));
  const buf = new ArrayBuffer(7);
  const view = new DataView(buf);
  view.setUint8(0, connectId);
  view.setUint8(1, 0x02); // Play tone command
  view.setUint8(2, 0x04); // Payload length: 4 bytes
  view.setUint16(3, f, true);
  view.setUint16(5, d, true);
  return new Uint8Array(buf);
}

/** Build Piezo Stop Command */
export function buildPiezoStopCommand(connectId: number): Uint8Array {
  return new Uint8Array([connectId, 0x03, 0x00]);
}

/** Build RGB LED Indexed Color Command (mode 0) */
export function buildLedIndexCommand(connectId: number, colorIndex: number): Uint8Array {
  const idx = Math.max(0, Math.min(10, Math.round(colorIndex)));
  return new Uint8Array([connectId, 0x04, 0x01, idx]);
}

/** Build RGB LED Absolute RGB Command (mode 1) */
export function buildLedRgbCommand(
  connectId: number,
  r: number,
  g: number,
  b: number
): Uint8Array {
  return new Uint8Array([
    connectId,
    0x04,
    0x03,
    Math.max(0, Math.min(255, Math.round(r))),
    Math.max(0, Math.min(255, Math.round(g))),
    Math.max(0, Math.min(255, Math.round(b))),
  ]);
}

export interface AttachedIOEvent {
  connectId: number;
  attached: boolean;
  internal: boolean;
  deviceType: WeDoDeviceType;
}

/** Parse Attached I/O Notification (characteristic 0x1527) */
export function parseAttachedIO(data: DataView): AttachedIOEvent | null {
  if (data.byteLength < 2) return null;
  const connectId = data.getUint8(0);
  const event = data.getUint8(1);
  if (event === 0x00) {
    return { connectId, attached: false, internal: false, deviceType: 'none' };
  }
  if (event === 0x01 && data.byteLength >= 4) {
    const internal = data.getUint8(2) === 0x01;
    const deviceType = deviceTypeFromByte(data.getUint8(3));
    return { connectId, attached: true, internal, deviceType };
  }
  return null;
}

/** Parse Motion Sensor notification value (characteristic 0x1560) */
export function parseMotionValue(
  data: DataView,
  mode: MotionSensorMode
): { distance?: number; count?: number } {
  if (data.byteLength < 3) return {};
  if (mode === 'detect') {
    let raw: number;
    if (data.byteLength >= 6) {
      raw = data.getFloat32(2, true);
      if (!Number.isFinite(raw)) raw = data.getUint8(2);
    } else {
      raw = data.getUint8(2);
    }
    const clamped = Math.max(0, Math.min(10, Math.round(raw * 10) / 10));
    return { distance: clamped };
  } else {
    let count: number;
    if (data.byteLength >= 6) {
      // SI mode returns float32, Raw mode returns uint32; detect cleanly
      const asFloat = data.getFloat32(2, true);
      const asUint = data.getUint32(2, true);
      if (asUint <= 1_000_000 && (!Number.isFinite(asFloat) || Math.abs(asFloat) < 1e-4)) {
        count = asUint;
      } else {
        count = Math.max(0, Math.round(asFloat));
      }
    } else {
      count = data.getUint8(2);
    }
    return { count };
  }
}

export function deriveTiltDirection(x: number, y: number, threshold = 15): TiltDirection {
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  if (absX < threshold && absY < threshold) return 'flat';
  if (absX >= absY) {
    return x > 0 ? 'right' : 'left';
  }
  return y > 0 ? 'up' : 'down';
}

export function tiltDirectionFromWeDoEnum(code: number): TiltDirection {
  switch (code) {
    case 0:
      return 'flat';
    case 3:
      return 'down';
    case 5:
      return 'right';
    case 7:
      return 'left';
    case 9:
      return 'up';
    default:
      return 'unknown';
  }
}

/** Parse Tilt Sensor notification value (characteristic 0x1560) */
export function parseTiltValue(
  data: DataView,
  mode: TiltSensorMode
): { x?: number; y?: number; direction?: TiltDirection; crashDelta?: number } {
  if (data.byteLength < 3) return {};
  if (mode === 'angle') {
    if (data.byteLength >= 10) {
      const x = Math.max(-45, Math.min(45, Math.round(data.getFloat32(2, true))));
      const y = Math.max(-45, Math.min(45, Math.round(data.getFloat32(6, true))));
      return { x, y, direction: deriveTiltDirection(x, y) };
    }
    if (data.byteLength >= 4) {
      const x = Math.max(-45, Math.min(45, data.getInt8(2)));
      const y = Math.max(-45, Math.min(45, data.getInt8(3)));
      return { x, y, direction: deriveTiltDirection(x, y) };
    }
    return {};
  }
  if (mode === 'tilt') {
    const code = data.byteLength >= 6 ? Math.round(data.getFloat32(2, true)) : data.getUint8(2);
    return { direction: tiltDirectionFromWeDoEnum(code) };
  }
  // mode === 'crash': 3 bytes (X, Y, Z crash counters) or 12 bytes (3 float32s)
  if (data.byteLength >= 5) {
    const sum = data.getUint8(2) + data.getUint8(3) + data.getUint8(4);
    return { crashDelta: sum };
  }
  return { crashDelta: data.getUint8(2) };
}

/** Approximate WeDo 2.0 distance (0..10 scale) to centimeters (~0..15 cm) */
export function distanceToApproxCm(distance: number): number {
  return Math.round(distance * 1.5 * 10) / 10;
}

export function hexToRgb(hex: string): RGBColor {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { r: 37, g: 99, b: 235 };
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGBColor): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

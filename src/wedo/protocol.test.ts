import { describe, expect, it } from 'vitest';
import {
  buildInputFormatCommand,
  buildLedIndexCommand,
  buildLedRgbCommand,
  buildMotorPowerCommand,
  buildMotorStopCommand,
  buildPiezoStopCommand,
  buildPiezoToneCommand,
  deriveTiltDirection,
  DEVICE_TYPE_IDS,
  INPUT_UNIT,
  parseAttachedIO,
  parseMotionValue,
  parseTiltValue,
} from './protocol';

describe('LEGO WeDo 2.0 BLE Protocol', () => {
  it('builds valid motor power packets for forward, reverse, and clamping', () => {
    expect(Array.from(buildMotorPowerCommand(1, 50))).toEqual([1, 0x01, 0x01, 50]);
    expect(Array.from(buildMotorPowerCommand(2, -50))).toEqual([2, 0x01, 0x01, 206]);
    expect(Array.from(buildMotorPowerCommand(1, 150))).toEqual([1, 0x01, 0x01, 100]);
    expect(Array.from(buildMotorPowerCommand(1, -150))).toEqual([1, 0x01, 0x01, 156]);
  });

  it('builds brake (0x7F) and drift (0x00) motor stop packets', () => {
    expect(Array.from(buildMotorStopCommand(1, true))).toEqual([1, 0x01, 0x01, 0x7f]);
    expect(Array.from(buildMotorStopCommand(1, false))).toEqual([1, 0x01, 0x01, 0x00]);
  });

  it('builds piezo tone and stop packets in little-endian', () => {
    // 440 Hz = 0x01B8, 500 ms = 0x01F4
    expect(Array.from(buildPiezoToneCommand(5, 440, 500))).toEqual([
      5, 0x02, 0x04, 0xb8, 0x01, 0xf4, 0x01,
    ]);
    expect(Array.from(buildPiezoStopCommand(5))).toEqual([5, 0x03, 0x00]);
  });

  it('builds RGB LED indexed and absolute packets', () => {
    expect(Array.from(buildLedIndexCommand(6, 9))).toEqual([6, 0x04, 0x01, 9]);
    expect(Array.from(buildLedRgbCommand(6, 255, 128, 0))).toEqual([6, 0x04, 0x03, 255, 128, 0]);
  });

  it('builds 11-byte Input Format setup packets', () => {
    const pkt = buildInputFormatCommand(2, DEVICE_TYPE_IDS.MOTION, 0, INPUT_UNIT.SI, true, 1);
    expect(pkt.length).toBe(11);
    expect(Array.from(pkt)).toEqual([0x01, 0x02, 2, 0x23, 0x00, 1, 0, 0, 0, 0x02, 0x01]);
  });

  it('parses Attached I/O notifications for attach and detach', () => {
    const attachBuf = new Uint8Array([2, 0x01, 0x00, DEVICE_TYPE_IDS.MOTION]).buffer;
    expect(parseAttachedIO(new DataView(attachBuf))).toEqual({
      connectId: 2,
      attached: true,
      internal: false,
      deviceType: 'motion',
    });

    const detachBuf = new Uint8Array([2, 0x00]).buffer;
    expect(parseAttachedIO(new DataView(detachBuf))).toEqual({
      connectId: 2,
      attached: false,
      internal: false,
      deviceType: 'none',
    });
  });

  it('parses Motion Sensor float32 SI distance and count values', () => {
    const buf = new ArrayBuffer(6);
    const dv = new DataView(buf);
    dv.setUint8(0, 1);
    dv.setUint8(1, 2);
    dv.setFloat32(2, 3.46, true);
    expect(parseMotionValue(dv, 'detect')).toEqual({ distance: 3.5 });

    const countBuf = new ArrayBuffer(6);
    const cdv = new DataView(countBuf);
    cdv.setUint8(0, 1);
    cdv.setUint8(1, 2);
    cdv.setFloat32(2, 12.0, true);
    expect(parseMotionValue(cdv, 'count')).toEqual({ count: 12 });
  });

  it('parses Tilt Sensor signed Int8 X/Y angles and derives direction', () => {
    const buf = new ArrayBuffer(4);
    const dv = new DataView(buf);
    dv.setUint8(0, 1);
    dv.setUint8(1, 2);
    dv.setInt8(2, -32);
    dv.setInt8(3, 5);
    expect(parseTiltValue(dv, 'angle')).toEqual({ x: -32, y: 5, direction: 'left' });
    expect(deriveTiltDirection(0, 28)).toBe('up');
    expect(deriveTiltDirection(5, -4)).toBe('flat');
  });
});

import { PortSelection, TiltDirection } from '../types/wedo';
import { WeDoHubManager } from '../wedo/hubController';
import {
  distanceToApproxCm,
  hexToRgb,
  MELODIES,
  NOTE_FREQUENCIES,
} from '../wedo/protocol';

export class ProgramCancelledError extends Error {
  constructor() {
    super('Program stopped');
    this.name = 'ProgramCancelledError';
  }
}

export type CompareOp = '<' | '<=' | '>' | '>=' | '==' | 'between';

export function compareDistance(
  current: number,
  op: CompareOp,
  valA: number,
  valB = 10
): boolean {
  switch (op) {
    case '<':
      return current < valA;
    case '<=':
      return current <= valA;
    case '>':
      return current > valA;
    case '>=':
      return current >= valA;
    case '==':
      return Math.abs(current - valA) <= 0.25;
    case 'between': {
      const lo = Math.min(valA, valB);
      const hi = Math.max(valA, valB);
      return current >= lo && current <= hi;
    }
  }
}

/**
 * Unified async execution runtime shared by Simple Blocks, Blockly, and Python.
 * Supports clean cancellation, parallel tasks, sensor polling, motor ramping, and melodies.
 */
export class ProgramRuntime {
  private abortController = new AbortController();
  private backgroundTasks: Promise<void>[] = [];

  constructor(private readonly hub: WeDoHubManager) {}

  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  get isStopped(): boolean {
    return this.abortController.signal.aborted;
  }

  checkAlive(): void {
    if (this.abortController.signal.aborted) {
      throw new ProgramCancelledError();
    }
  }

  async stop(): Promise<void> {
    if (!this.abortController.signal.aborted) {
      this.abortController.abort();
    }
    await Promise.allSettled(this.backgroundTasks);
    this.backgroundTasks = [];
    await this.hub.stopMotor(true, 'A');
    await this.hub.stopMotor(true, 'B');
    await this.hub.stopTone();
  }

  async wait(seconds: number): Promise<void> {
    this.checkAlive();
    const ms = Math.max(0, seconds * 1000);
    if (ms === 0) return;

    await new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        window.clearTimeout(timer);
        reject(new ProgramCancelledError());
      };
      const timer = window.setTimeout(() => {
        this.signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      this.signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  async waitUntil(predicate: () => boolean, pollMs = 40): Promise<void> {
    this.checkAlive();
    while (!predicate()) {
      await this.wait(pollMs / 1000);
    }
  }

  async motor(power: number, port: PortSelection = 'auto'): Promise<void> {
    this.checkAlive();
    await this.hub.setMotorPower(power, port);
  }

  async motorFor(
    power: number,
    seconds: number,
    brake = true,
    port: PortSelection = 'auto'
  ): Promise<void> {
    this.checkAlive();
    await this.hub.setMotorPower(power, port);
    await this.wait(seconds);
    await this.hub.stopMotor(brake, port);
  }

  async stopMotor(brake = true, port: PortSelection = 'auto'): Promise<void> {
    this.checkAlive();
    await this.hub.stopMotor(brake, port);
  }

  async rampMotor(
    fromPower: number,
    toPower: number,
    seconds: number,
    port: PortSelection = 'auto'
  ): Promise<void> {
    this.checkAlive();
    const steps = Math.max(4, Math.min(40, Math.round(seconds * 15)));
    const dt = seconds / steps;
    for (let i = 0; i <= steps; i++) {
      this.checkAlive();
      const t = i / steps;
      const p = fromPower + (toPower - fromPower) * t;
      await this.hub.setMotorPower(p, port);
      if (i < steps) await this.wait(dt);
    }
  }

  async ledRgb(r: number, g: number, b: number): Promise<void> {
    this.checkAlive();
    await this.hub.setLedRgb(r, g, b);
  }

  async ledHex(hex: string): Promise<void> {
    this.checkAlive();
    const { r, g, b } = hexToRgb(hex);
    await this.hub.setLedRgb(r, g, b);
  }

  async ledIndex(index: number): Promise<void> {
    this.checkAlive();
    await this.hub.setLedIndex(index);
  }

  async tone(freqHz: number, durationMs: number, waitFinish = true): Promise<void> {
    this.checkAlive();
    await this.hub.playTone(freqHz, durationMs);
    if (waitFinish) {
      await this.wait(durationMs / 1000);
    }
  }

  async note(noteName: string, durationMs = 300, waitFinish = true): Promise<void> {
    const freq = NOTE_FREQUENCIES[noteName.toUpperCase()] ?? 440;
    await this.tone(freq, durationMs, waitFinish);
  }

  async melody(name: string): Promise<void> {
    this.checkAlive();
    const m = MELODIES[name] ?? MELODIES.startup;
    for (const [freq, dur, gap = 30] of m.notes) {
      this.checkAlive();
      await this.hub.playTone(freq, dur);
      await this.wait((dur + gap) / 1000);
    }
  }

  async stopSound(): Promise<void> {
    this.checkAlive();
    await this.hub.stopTone();
  }

  // --- Sensor getters ---
  distance(): number {
    return this.hub.getState().distance;
  }

  distanceCm(): number {
    return distanceToApproxCm(this.hub.getState().distance);
  }

  motionCount(): number {
    return this.hub.getState().motionCount;
  }

  tiltX(): number {
    return this.hub.getState().tiltX;
  }

  tiltY(): number {
    return this.hub.getState().tiltY;
  }

  tiltDirection(): TiltDirection {
    return this.hub.getState().tiltDirection;
  }

  crashCount(): number {
    return this.hub.getState().crashCount;
  }

  buttonPressed(): boolean {
    return this.hub.getState().buttonPressed;
  }

  battery(): number {
    return this.hub.getState().battery ?? 0;
  }

  // --- Sensor waiters ---
  async waitDistance(op: CompareOp, valA: number, valB = 10): Promise<void> {
    await this.waitUntil(() => compareDistance(this.distance(), op, valA, valB));
  }

  async waitTilt(dir: TiltDirection): Promise<void> {
    await this.waitUntil(() => this.tiltDirection() === dir);
  }

  async waitTiltAngle(axis: 'x' | 'y', op: '<' | '>', deg: number): Promise<void> {
    await this.waitUntil(() => {
      const v = axis === 'x' ? this.tiltX() : this.tiltY();
      return op === '<' ? v < deg : v > deg;
    });
  }

  async waitCrash(): Promise<void> {
    const startCount = this.crashCount();
    await this.waitUntil(() => this.crashCount() > startCount);
  }

  async waitButton(): Promise<void> {
    await this.waitUntil(() => this.buttonPressed());
  }

  async setMotionMode(mode: 'detect' | 'count'): Promise<void> {
    this.checkAlive();
    await this.hub.setMotionMode(mode);
  }

  async resetMotionCount(): Promise<void> {
    this.checkAlive();
    await this.hub.resetMotionCount();
  }

  async setTiltMode(mode: 'angle' | 'tilt' | 'crash'): Promise<void> {
    this.checkAlive();
    await this.hub.setTiltMode(mode);
  }

  log(msg: string, level: 'info' | 'python' = 'info'): void {
    this.hub.emitLog(level, String(msg));
  }

  /**
   * Register a repeating edge-triggered background listener (runs concurrently until Stop).
   */
  spawnWatcher(predicate: () => boolean, handler: () => Promise<void>): void {
    const task = (async () => {
      let prev = false;
      try {
        while (!this.isStopped) {
          const cur = predicate();
          if (cur && !prev) {
            await handler();
          }
          prev = cur;
          await this.wait(0.05);
        }
      } catch (err) {
        if (!(err instanceof ProgramCancelledError)) {
          this.hub.emitLog('error', `Watcher error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    })();
    this.backgroundTasks.push(task);
  }

  spawnTask(fn: () => Promise<void>): void {
    const task = (async () => {
      try {
        await fn();
      } catch (err) {
        if (!(err instanceof ProgramCancelledError)) {
          this.hub.emitLog('error', `Task error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    })();
    this.backgroundTasks.push(task);
  }

  async waitForAllTasks(): Promise<void> {
    if (this.backgroundTasks.length === 0) return;
    await Promise.allSettled(this.backgroundTasks);
  }
}

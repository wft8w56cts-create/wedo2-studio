import { compareDistance, CompareOp, ProgramCancelledError, ProgramRuntime } from '../../runtime/executionContext';
import { PortSelection, TiltDirection } from '../../types/wedo';

interface PyodideInstance {
  runPythonAsync(code: string): Promise<unknown>;
  runPython(code: string): unknown;
  registerJsModule(name: string, module: Record<string, unknown>): void;
  setStdout(options: { batched: (msg: string) => void }): void;
  setStderr(options: { batched: (msg: string) => void }): void;
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInstance>;
  }
}

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/';

let pyodidePromise: Promise<PyodideInstance> | null = null;
let pyodideInstance: PyodideInstance | null = null;

function loadPyodideScript(): Promise<void> {
  if (typeof window.loadPyodide === 'function') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-pyodide="1"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Pyodide CDN')), {
        once: true,
      });
      return;
    }
    const script = document.createElement('script');
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.async = true;
    script.dataset.pyodide = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Pyodide from jsDelivr CDN'));
    document.head.appendChild(script);
  });
}

export function isPyodideLoaded(): boolean {
  return pyodideInstance !== null;
}

export async function ensurePyodide(): Promise<PyodideInstance> {
  if (pyodideInstance) return pyodideInstance;
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadPyodideScript();
      if (!window.loadPyodide) throw new Error('Pyodide loader missing');
      const py = await window.loadPyodide({ indexURL: PYODIDE_CDN });
      pyodideInstance = py;
      return py;
    })();
  }
  return pyodidePromise;
}

const WEDO_PYTHON_MODULE = `
import asyncio
import sys
import types
import wedo_bridge as _b

mod = types.ModuleType("wedo")

async def wait(seconds):
    await _b.wait(float(seconds))

async def motor(power, port="auto"):
    await _b.motor(float(power), str(port))

async def motor_for(power, seconds, brake=True, port="auto"):
    await _b.motorFor(float(power), float(seconds), bool(brake), str(port))

async def ramp_motor(from_power, to_power, seconds, port="auto"):
    await _b.rampMotor(float(from_power), float(to_power), float(seconds), str(port))

async def stop_motor(brake=True, port="auto"):
    await _b.stopMotor(bool(brake), str(port))

async def led_rgb(r, g, b):
    await _b.ledRgb(int(r), int(g), int(b))

async def led_hex(hex_str):
    await _b.ledHex(str(hex_str))

async def led_color(index):
    await _b.ledIndex(int(index))

async def tone(freq_hz, duration_ms=300, wait_finish=True):
    await _b.tone(float(freq_hz), float(duration_ms), bool(wait_finish))

async def note(note_name, duration_ms=300, wait_finish=True):
    await _b.note(str(note_name), float(duration_ms), bool(wait_finish))

async def melody(name="startup"):
    await _b.melody(str(name))

async def stop_sound():
    await _b.stopSound()

def distance():
    return float(_b.distance())

def distance_cm():
    return float(_b.distanceCm())

def motion_count():
    return int(_b.motionCount())

async def set_motion_mode(mode):
    await _b.setMotionMode(str(mode))

async def reset_motion_count():
    await _b.resetMotionCount()

def tilt_x():
    return int(_b.tiltX())

def tilt_y():
    return int(_b.tiltY())

def tilt_direction():
    return str(_b.tiltDirection())

def crash_count():
    return int(_b.crashCount())

async def set_tilt_mode(mode):
    await _b.setTiltMode(str(mode))

def button_pressed():
    return bool(_b.buttonPressed())

def battery():
    return int(_b.battery())

async def wait_distance(op, val_a, val_b=10.0):
    await _b.waitDistance(str(op), float(val_a), float(val_b))

async def wait_distance_between(min_d, max_d):
    await _b.waitDistance("between", float(min_d), float(max_d))

async def wait_tilt(direction):
    await _b.waitTilt(str(direction))

async def wait_crash():
    await _b.waitCrash()

async def wait_button():
    await _b.waitButton()

def log(*args):
    _b.log(" ".join(str(a) for a in args))

_watchers = []

def _register_watcher(pred, coro_fn):
    async def _loop():
        prev = False
        while not _b.isStopped():
            cur = bool(pred())
            if cur and not prev:
                res = coro_fn()
                if asyncio.iscoroutine(res):
                    await res
            prev = cur
            await wait(0.05)
    _watchers.append(asyncio.ensure_future(_loop()))

def on_distance(op, val, fn):
    _register_watcher(lambda: _b.cmpDistance(distance(), str(op), float(val), 10.0), fn)

def on_distance_between(min_d, max_d, fn):
    _register_watcher(lambda: _b.cmpDistance(distance(), "between", float(min_d), float(max_d)), fn)

def on_tilt(direction, fn):
    _register_watcher(lambda: tilt_direction() == str(direction), fn)

def on_button(fn):
    _register_watcher(lambda: button_pressed(), fn)

async def _wait_watchers():
    if _watchers:
        await asyncio.gather(*_watchers, return_exceptions=True)

for _name in [
    "wait", "motor", "motor_for", "ramp_motor", "stop_motor",
    "led_rgb", "led_hex", "led_color", "tone", "note", "melody", "stop_sound",
    "distance", "distance_cm", "motion_count", "set_motion_mode", "reset_motion_count",
    "tilt_x", "tilt_y", "tilt_direction", "crash_count", "set_tilt_mode",
    "button_pressed", "battery", "wait_distance", "wait_distance_between",
    "wait_tilt", "wait_crash", "wait_button", "log",
    "on_distance", "on_distance_between", "on_tilt", "on_button", "_wait_watchers"
]:
    setattr(mod, _name, locals()[_name])

sys.modules["wedo"] = mod
`;

export async function runPythonProgram(
  code: string,
  runtime: ProgramRuntime,
  onLog: (level: 'python' | 'error', msg: string) => void
): Promise<void> {
  const py = await ensurePyodide();

  py.setStdout({
    batched: (msg) => {
      if (msg.trim()) onLog('python', msg);
    },
  });
  py.setStderr({
    batched: (msg) => {
      if (msg.trim()) onLog('error', msg);
    },
  });

  const bridge = {
    wait: (s: number) => runtime.wait(s),
    motor: (p: number, port: PortSelection) => runtime.motor(p, port),
    motorFor: (p: number, s: number, brake: boolean, port: PortSelection) =>
      runtime.motorFor(p, s, brake, port),
    rampMotor: (a: number, b: number, s: number, port: PortSelection) =>
      runtime.rampMotor(a, b, s, port),
    stopMotor: (brake: boolean, port: PortSelection) => runtime.stopMotor(brake, port),
    ledRgb: (r: number, g: number, b: number) => runtime.ledRgb(r, g, b),
    ledHex: (hex: string) => runtime.ledHex(hex),
    ledIndex: (idx: number) => runtime.ledIndex(idx),
    tone: (f: number, ms: number, waitFinish: boolean) => runtime.tone(f, ms, waitFinish),
    note: (n: string, ms: number, waitFinish: boolean) => runtime.note(n, ms, waitFinish),
    melody: (m: string) => runtime.melody(m),
    stopSound: () => runtime.stopSound(),
    distance: () => runtime.distance(),
    distanceCm: () => runtime.distanceCm(),
    motionCount: () => runtime.motionCount(),
    setMotionMode: (m: 'detect' | 'count') => runtime.setMotionMode(m),
    resetMotionCount: () => runtime.resetMotionCount(),
    tiltX: () => runtime.tiltX(),
    tiltY: () => runtime.tiltY(),
    tiltDirection: () => runtime.tiltDirection(),
    crashCount: () => runtime.crashCount(),
    setTiltMode: (m: 'angle' | 'tilt' | 'crash') => runtime.setTiltMode(m),
    buttonPressed: () => runtime.buttonPressed(),
    battery: () => runtime.battery(),
    waitDistance: (op: CompareOp, a: number, b: number) => runtime.waitDistance(op, a, b),
    waitTilt: (d: TiltDirection) => runtime.waitTilt(d),
    waitCrash: () => runtime.waitCrash(),
    waitButton: () => runtime.waitButton(),
    cmpDistance: (cur: number, op: CompareOp, a: number, b: number) =>
      compareDistance(cur, op, a, b),
    isStopped: () => runtime.isStopped,
    log: (msg: string) => onLog('python', msg),
  };

  py.registerJsModule('wedo_bridge', bridge);
  py.runPython(WEDO_PYTHON_MODULE);

  const wrappedCode = `
import wedo
from wedo import *
${code}
await wedo._wait_watchers()
`;

  try {
    await py.runPythonAsync(wrappedCode);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (runtime.isStopped || msg.includes('Program stopped') || msg.includes('ProgramCancelledError')) {
      throw new ProgramCancelledError();
    }
    throw err;
  }
}

import React, { useEffect, useRef, useState } from 'react';
import {
  Compass,
  Cpu,
  Hand,
  Radar,
  RotateCcw,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { getT } from '../i18n/translations';
import { Language } from '../types/wedo';
import { distanceToApproxCm, rgbToHex } from '../wedo/protocol';
import { useWeDo } from '../wedo/useWeDo';

interface Props {
  lang: Language;
  onClose: () => void;
}

export const SimulatorDrawer: React.FC<Props> = ({ lang, onClose }) => {
  const t = getT(lang);
  const { state, manager } = useWeDo();

  const [wheelAngle, setWheelAngle] = useState(0);
  const motorPower =
    state.ports.A.deviceType === 'motor'
      ? state.motorPower.A
      : state.ports.B.deviceType === 'motor'
        ? state.motorPower.B
        : state.motorPower.A;

  const isBraked =
    state.ports.A.deviceType === 'motor'
      ? state.motorBraked.A
      : state.motorBraked.B;

  const powerRef = useRef(motorPower);
  powerRef.current = motorPower;

  // Smooth spinning wheel animation proportional to motor power
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (powerRef.current !== 0) {
        setWheelAngle((a) => (a + powerRef.current * 4.2 * dt) % 360);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ledHex = rgbToHex(state.ledColor);

  const handleTiltPadPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1 && e.type === 'pointermove') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    manager.setSimTilt(Math.round(nx * 45), Math.round(ny * 45));
  };

  return (
    <aside className="w-80 shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Cpu className="w-4 h-4" />
            {t.sim.title}
          </h3>
          <p className="text-[11px] text-slate-400">{t.sim.subtitle}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          title={t.sim.hide}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Visual Hub + Spinning Motor Wheel */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-around gap-3">
          {/* Smart Hub Visual */}
          <div className="relative w-24 h-28 rounded-2xl bg-slate-100 border-2 border-slate-300 shadow-inner flex flex-col items-center justify-between p-2.5 text-slate-800">
            <div className="flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400" />
            </div>

            {/* RGB LED */}
            <div
              className="w-5 h-3 rounded-full border border-slate-400 transition-colors"
              style={{
                backgroundColor: ledHex,
                boxShadow: `0 0 14px 3px ${ledHex}`,
              }}
            />

            {/* Interactive Green Hub Button */}
            <button
              onPointerDown={() => manager.setSimButton(true)}
              onPointerUp={() => manager.setSimButton(false)}
              onPointerLeave={() => manager.setSimButton(false)}
              className={`w-10 h-10 rounded-full border-2 border-emerald-700 transition active:scale-90 flex items-center justify-center ${
                state.buttonPressed
                  ? 'bg-emerald-400 shadow-lg shadow-emerald-400/60'
                  : 'bg-emerald-500 hover:bg-emerald-400'
              }`}
              title={t.sim.holdButton}
            >
              <Hand className="w-4 h-4 text-emerald-950" />
            </button>

            {state.activeTone && (
              <div className="absolute -top-2.5 -right-2.5 px-1.5 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-mono flex items-center gap-0.5 shadow animate-bounce">
                <Volume2 className="w-3 h-3" />
                {state.activeTone.freq}
              </div>
            )}
          </div>

          {/* Animated Motor Wheel */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-700 flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-full border-4 border-emerald-500/80 relative flex items-center justify-center"
                style={{ transform: `rotate(${wheelAngle}deg)` }}
              >
                <div className="w-2 h-6 bg-emerald-400 rounded-full absolute -top-1" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400">
              {motorPower !== 0
                ? `${motorPower > 0 ? '+' : ''}${motorPower}%`
                : isBraked
                  ? t.sim.braked
                  : t.sim.drifting}
            </div>
          </div>
        </div>

        {/* Distance Sensor Controls */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-sky-400 flex items-center gap-1.5">
              <Radar className="w-3.5 h-3.5" />
              {t.sim.distanceSlider}
            </span>
            <span className="font-mono text-white font-bold">
              {state.distance.toFixed(1)}{' '}
              <span className="text-slate-400 font-normal">
                (~{distanceToApproxCm(state.distance).toFixed(1)} cm)
              </span>
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={0.1}
            value={state.distance}
            onChange={(e) => manager.setSimDistance(Number(e.target.value))}
            className="w-full accent-sky-400"
          />
          <div className="flex items-center justify-between gap-1.5">
            {[1.0, 2.5, 4.5, 8.0, 10.0].map((v) => (
              <button
                key={v}
                onClick={() => manager.setSimDistance(v)}
                className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300"
              >
                {v.toFixed(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => manager.triggerSimObjectPass()}
            className="w-full py-1.5 rounded-lg text-xs font-medium bg-sky-600/20 hover:bg-sky-600/35 text-sky-300 border border-sky-500/40"
          >
            {t.sim.passObject} ({state.motionCount})
          </button>
        </div>

        {/* Tilt Sensor 2D Interactive Pad */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-teal-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              {t.sim.tiltPad}
            </span>
            <button
              onClick={() => manager.setSimTilt(0, 0)}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              {t.sim.centerTilt}
            </button>
          </div>

          <div
            onPointerDown={handleTiltPadPointer}
            onPointerMove={handleTiltPadPointer}
            className="relative h-28 rounded-xl bg-slate-900 border border-slate-700 cursor-crosshair select-none overflow-hidden touch-none"
          >
            <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-slate-800" />
            <div
              className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-teal-400 border-2 border-white shadow-lg"
              style={{
                left: `${((state.tiltX + 45) / 90) * 100}%`,
                top: `${((45 - state.tiltY) / 90) * 100}%`,
              }}
            />
            <div className="absolute bottom-1 left-2 text-[10px] font-mono text-slate-400">
              X:{state.tiltX}° Y:{state.tiltY}° ({t.sensors.directions[state.tiltDirection]})
            </div>
          </div>

          <button
            onClick={() => manager.triggerSimCrash()}
            className="w-full py-1.5 rounded-lg text-xs font-medium bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border border-rose-500/40 flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            {t.sim.triggerCrash} ({state.crashCount})
          </button>
        </div>

        {/* Virtual Port Setup */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t.sim.virtualPorts}
          </div>
          {(['A', 'B'] as const).map((port) => (
            <div key={port} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-300 font-medium">
                {port === 'A' ? t.ports.portA : t.ports.portB}
              </span>
              <select
                value={state.ports[port].deviceType}
                onChange={(e) =>
                  manager.setSimPortDevice(
                    port,
                    e.target.value as 'none' | 'motor' | 'motion' | 'tilt'
                  )
                }
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
              >
                <option value="motor">{t.ports.motor}</option>
                <option value="motion">{t.ports.motion}</option>
                <option value="tilt">{t.ports.tilt}</option>
                <option value="none">{t.ports.none}</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

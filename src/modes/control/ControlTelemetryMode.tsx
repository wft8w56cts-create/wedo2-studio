import React, { useRef, useState } from 'react';
import {
  Activity,
  Battery,
  Cog,
  Compass,
  Lightbulb,
  Music,
  OctagonX,
  Power,
  Radar,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getT } from '../../i18n/translations';
import { Language, MotionSensorMode, PortSelection, TiltSensorMode } from '../../types/wedo';
import {
  distanceToApproxCm,
  hexToRgb,
  LEGO_COLORS,
  MELODIES,
  NOTE_FREQUENCIES,
  rgbToHex,
} from '../../wedo/protocol';
import { useWeDo } from '../../wedo/useWeDo';

interface Props {
  lang: Language;
}

const PIANO_KEYS = [
  { note: 'C4', sharp: false },
  { note: 'C#4', sharp: true },
  { note: 'D4', sharp: false },
  { note: 'D#4', sharp: true },
  { note: 'E4', sharp: false },
  { note: 'F4', sharp: false },
  { note: 'F#4', sharp: true },
  { note: 'G4', sharp: false },
  { note: 'G#4', sharp: true },
  { note: 'A4', sharp: false },
  { note: 'A#4', sharp: true },
  { note: 'B4', sharp: false },
  { note: 'C5', sharp: false },
];

export const ControlTelemetryMode: React.FC<Props> = ({ lang }) => {
  const t = getT(lang);
  const { state, telemetry, manager } = useWeDo();

  const [motorPort, setMotorPort] = useState<PortSelection>('auto');
  const [freq, setFreq] = useState(523);
  const [dur, setDur] = useState(300);
  const [rainbowActive, setRainbowActive] = useState(false);
  const rainbowTimerRef = useRef<number | null>(null);

  const activeMotorPower =
    motorPort === 'A'
      ? state.motorPower.A
      : motorPort === 'B'
        ? state.motorPower.B
        : state.ports.A.deviceType === 'motor'
          ? state.motorPower.A
          : state.ports.B.deviceType === 'motor'
            ? state.motorPower.B
            : state.motorPower.A;

  const ensureConnected = () => {
    if (state.connectionMode === 'disconnected') {
      manager.connectSimulator();
    }
  };

  const toggleRainbow = () => {
    ensureConnected();
    if (rainbowActive) {
      if (rainbowTimerRef.current !== null) window.clearInterval(rainbowTimerRef.current);
      rainbowTimerRef.current = null;
      setRainbowActive(false);
      return;
    }
    setRainbowActive(true);
    let hue = 0;
    rainbowTimerRef.current = window.setInterval(() => {
      hue = (hue + 18) % 360;
      const c = 1;
      const x = 1 - Math.abs(((hue / 60) % 2) - 1);
      let r = 0,
        g = 0,
        b = 0;
      if (hue < 60) [r, g, b] = [c, x, 0];
      else if (hue < 120) [r, g, b] = [x, c, 0];
      else if (hue < 180) [r, g, b] = [0, c, x];
      else if (hue < 240) [r, g, b] = [0, x, c];
      else if (hue < 300) [r, g, b] = [x, 0, c];
      else [r, g, b] = [c, 0, x];
      void manager.setLedRgb(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
    }, 180);
  };

  const playQuickMelody = async (key: string) => {
    ensureConnected();
    const m = MELODIES[key];
    if (!m) return;
    for (const [f, d, gap = 30] of m.notes) {
      await manager.playTone(f, d);
      await new Promise((r) => setTimeout(r, d + gap));
    }
  };

  // Build SVG polyline points for distance (0..10) & tilt (-45..45)
  const chartW = 360;
  const chartH = 110;
  const pts = telemetry.length > 1 ? telemetry : [{ t: 0, distance: state.distance, tiltX: state.tiltX, tiltY: state.tiltY, motorPower: activeMotorPower }];

  const distLine = pts
    .map((p, idx) => {
      const x = (idx / Math.max(1, pts.length - 1)) * chartW;
      const y = chartH - (Math.max(0, Math.min(10, p.distance)) / 10) * (chartH - 12) - 6;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const tiltXLine = pts
    .map((p, idx) => {
      const x = (idx / Math.max(1, pts.length - 1)) * chartW;
      const y = chartH / 2 - (Math.max(-45, Math.min(45, p.tiltX)) / 45) * (chartH / 2 - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const tiltYLine = pts
    .map((p, idx) => {
      const x = (idx / Math.max(1, pts.length - 1)) * chartW;
      const y = chartH / 2 - (Math.max(-45, Math.min(45, p.tiltY)) / 45) * (chartH / 2 - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const ledHex = rgbToHex(state.ledColor);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {state.connectionMode === 'disconnected' && (
        <div className="bg-blue-950/50 border border-blue-700/50 text-blue-200 rounded-xl px-4 py-3 text-xs flex items-center justify-between gap-3">
          <span>{t.control.notConnectedHint}</span>
          <button
            onClick={() => manager.connectSimulator()}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
          >
            {t.simulator}
          </button>
        </div>
      )}

      {/* Top Row: Telemetry Charts & Live Sensor Modes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Distance Sensor Telemetry */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Radar className="w-4 h-4 text-sky-400" />
              {t.control.distanceChart}
            </h3>
            <div className="flex items-center gap-1.5">
              {(['detect', 'count'] as MotionSensorMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    ensureConnected();
                    void manager.setMotionMode(m);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                    state.motionMode === m
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'detect' ? t.sensors.modeDetect : t.sensors.modeCount}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] uppercase text-slate-400">{t.sensors.distance}</div>
              <div className="text-2xl font-mono font-bold text-sky-400">
                {state.distance.toFixed(1)}
              </div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] uppercase text-slate-400">{t.sensors.distanceCm}</div>
              <div className="text-2xl font-mono font-bold text-cyan-300">
                ~{distanceToApproxCm(state.distance).toFixed(1)}
              </div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-slate-400">{t.sensors.count}</span>
                <button
                  onClick={() => void manager.resetMotionCount()}
                  title={t.sensors.resetCount}
                  className="text-slate-400 hover:text-white"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
              <div className="text-2xl font-mono font-bold text-amber-400">
                {state.motionCount}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 p-2">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-28 overflow-visible">
              {[0, 2.5, 5, 7.5, 10].map((v) => {
                const y = chartH - (v / 10) * (chartH - 12) - 6;
                return (
                  <g key={v}>
                    <line x1={0} y1={y} x2={chartW} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                    <text x={2} y={y - 2} fill="#64748b" fontSize="9">
                      {v}
                    </text>
                  </g>
                );
              })}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinejoin="round"
                points={distLine}
              />
            </svg>
          </div>
        </div>

        {/* Tilt Sensor Telemetry & 2D Bubble Horizon */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-400" />
              {t.control.tiltChart}
            </h3>
            <div className="flex items-center gap-1">
              {(['angle', 'tilt', 'crash'] as TiltSensorMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    ensureConnected();
                    void manager.setTiltMode(m);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                    state.tiltMode === m
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'angle'
                    ? t.sensors.modeAngle
                    : m === 'tilt'
                      ? t.sensors.modeTilt
                      : t.sensors.modeCrash}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 2D Bubble Level */}
            <div className="relative w-24 h-24 shrink-0 rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center">
              <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-slate-800" />
              <div
                className="w-4 h-4 rounded-full bg-teal-400 shadow-lg shadow-teal-500/50 transition-transform duration-75"
                style={{
                  transform: `translate(${(state.tiltX / 45) * 34}px, ${-(state.tiltY / 45) * 34}px)`,
                }}
              />
            </div>

            <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                <div className="text-[10px] text-emerald-400">X (°)</div>
                <div className="text-xl font-mono font-bold text-white">{state.tiltX}°</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                <div className="text-[10px] text-fuchsia-400">Y (°)</div>
                <div className="text-xl font-mono font-bold text-white">{state.tiltY}°</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                <div className="text-[10px] text-slate-400">{t.sensors.crash}</div>
                <div className="text-xl font-mono font-bold text-rose-400">{state.crashCount}</div>
              </div>
              <div className="col-span-3 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">{t.sensors.tiltDir}:</span>
                <span className="font-semibold text-teal-300">
                  {t.sensors.directions[state.tiltDirection]}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 p-2">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-24 overflow-visible">
              <line x1={0} y1={chartH / 2} x2={chartW} y2={chartH / 2} stroke="#334155" strokeDasharray="3 3" />
              <polyline fill="none" stroke="#34d399" strokeWidth="2" points={tiltXLine} />
              <polyline fill="none" stroke="#e879f9" strokeWidth="2" points={tiltYLine} />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Row: Motor, RGB LED, Piezo Piano, Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Motor Control */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cog className="w-4 h-4 text-emerald-400" />
              {t.control.motorTitle}
            </h3>
            <select
              value={motorPort}
              onChange={(e) => setMotorPort(e.target.value as PortSelection)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs"
            >
              <option value="auto">Auto</option>
              <option value="A">{t.ports.portA}</option>
              <option value="B">{t.ports.portB}</option>
            </select>
          </div>

          <div className="text-center py-2">
            <div className="text-3xl font-mono font-bold text-emerald-400">
              {activeMotorPower > 0 ? `+${activeMotorPower}` : activeMotorPower}%
            </div>
          </div>

          <input
            type="range"
            min={-100}
            max={100}
            step={5}
            value={activeMotorPower}
            onChange={(e) => {
              ensureConnected();
              void manager.setMotorPower(Number(e.target.value), motorPort);
            }}
            className="w-full accent-emerald-500"
          />

          <div className="grid grid-cols-5 gap-1.5">
            {[-100, -50, 0, 50, 100].map((p) => (
              <button
                key={p}
                onClick={() => {
                  ensureConnected();
                  if (p === 0) void manager.stopMotor(true, motorPort);
                  else void manager.setMotorPower(p, motorPort);
                }}
                className="py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                {p > 0 ? `+${p}` : p}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                ensureConnected();
                void manager.stopMotor(true, motorPort);
              }}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
            >
              <OctagonX className="w-4 h-4" />
              {t.control.brakeStop}
            </button>
            <button
              onClick={() => {
                ensureConnected();
                void manager.stopMotor(false, motorPort);
              }}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              {t.control.driftStop}
            </button>
          </div>
        </div>

        {/* RGB LED Control */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-fuchsia-400" />
              {t.control.ledTitle}
            </h3>
            <div
              className="w-6 h-6 rounded-full border-2 border-white/30 shadow-lg"
              style={{ backgroundColor: ledHex, boxShadow: `0 0 14px ${ledHex}` }}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="color"
              value={ledHex}
              onChange={(e) => {
                ensureConnected();
                const { r, g, b } = hexToRgb(e.target.value);
                void manager.setLedRgb(r, g, b);
              }}
              className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0"
            />
            <div className="flex-1 text-xs font-mono text-slate-300">
              RGB({state.ledColor.r}, {state.ledColor.g}, {state.ledColor.b})
            </div>
            <button
              onClick={toggleRainbow}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                rainbowActive
                  ? 'bg-gradient-to-r from-pink-500 via-amber-400 to-cyan-400 text-slate-950 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t.control.rainbow}
            </button>
          </div>

          <div>
            <div className="text-[11px] text-slate-400 mb-1.5">{t.control.legoPalette}</div>
            <div className="grid grid-cols-6 gap-1.5">
              {LEGO_COLORS.map((c) => (
                <button
                  key={c.index}
                  title={lang === 'pl' ? c.namePl : c.nameEn}
                  onClick={() => {
                    ensureConnected();
                    void manager.setLedIndex(c.index);
                  }}
                  className="h-7 rounded-lg border border-white/20 hover:scale-105 transition"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Piezo Speaker & Piano */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-violet-400" />
              {t.control.soundTitle}
            </h3>
            <button
              onClick={() => void manager.stopTone()}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1"
            >
              <VolumeX className="w-3.5 h-3.5" />
              {t.control.stopSound}
            </button>
          </div>

          {/* Interactive Mini Piano */}
          <div className="flex gap-1 h-16">
            {PIANO_KEYS.map((k) => (
              <button
                key={k.note}
                onClick={() => {
                  ensureConnected();
                  void manager.playTone(NOTE_FREQUENCIES[k.note], 260);
                }}
                className={`flex-1 rounded-b-lg text-[9px] font-mono flex items-end justify-center pb-1 transition active:scale-95 ${
                  k.sharp
                    ? 'bg-slate-800 hover:bg-violet-700 text-slate-300 h-11'
                    : 'bg-slate-100 hover:bg-violet-200 text-slate-900 font-bold h-16'
                }`}
              >
                {k.note.replace('4', '').replace('5', '⁺')}
              </button>
            ))}
          </div>

          {/* Custom Hz + ms */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={80}
              max={4000}
              step={20}
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-center"
            />
            <span className="text-xs text-slate-400">Hz</span>
            <input
              type="number"
              min={50}
              max={3000}
              step={50}
              value={dur}
              onChange={(e) => setDur(Number(e.target.value))}
              className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-center"
            />
            <span className="text-xs text-slate-400">ms</span>
            <button
              onClick={() => {
                ensureConnected();
                void manager.playTone(freq, dur);
              }}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white"
            >
              {t.control.playTone}
            </button>
          </div>

          {/* Quick Melodies */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(MELODIES).map(([key, m]) => (
              <button
                key={key}
                onClick={() => void playQuickMelody(key)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                <Music className="w-3 h-3 text-violet-400" />
                {lang === 'pl' ? m.namePl : m.nameEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hub Diagnostics Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Activity className="w-4 h-4 text-blue-400" />
            {t.control.hubInfo}: <span className="text-blue-300">{state.hubName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Battery className="w-4 h-4 text-emerald-400" />
            {state.battery !== null ? `${state.battery}%` : '—'}
          </div>
          <div className="text-slate-300">
            {t.ports.portA}:{' '}
            <span className="font-semibold text-sky-300">
              {t.ports[state.ports.A.deviceType as keyof typeof t.ports] ?? state.ports.A.deviceType}
            </span>
          </div>
          <div className="text-slate-300">
            {t.ports.portB}:{' '}
            <span className="font-semibold text-sky-300">
              {t.ports[state.ports.B.deviceType as keyof typeof t.ports] ?? state.ports.B.deviceType}
            </span>
          </div>
          <div className="text-slate-300">
            {t.sensors.button}:{' '}
            <span className={state.buttonPressed ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {state.buttonPressed ? 'PRESSED' : 'OFF'}
            </span>
          </div>
        </div>

        {state.connectionMode === 'bluetooth' && (
          <button
            onClick={() => void manager.powerOffHub()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-700/50"
          >
            <Power className="w-3.5 h-3.5" />
            {t.control.powerOff}
          </button>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { BookOpen, Loader2, Play, Square, Terminal } from 'lucide-react';
import { getT } from '../../i18n/translations';
import { ProgramCancelledError, ProgramRuntime } from '../../runtime/executionContext';
import { Language } from '../../types/wedo';
import { useWeDo } from '../../wedo/useWeDo';
import { PYTHON_EXAMPLES } from './examples';
import { isPyodideLoaded, runPythonProgram } from './pyodideRunner';

interface Props {
  lang: Language;
  code: string;
  onCodeChange: (code: string) => void;
}

export const PythonMode: React.FC<Props> = ({ lang, code, onCodeChange }) => {
  const t = getT(lang);
  const { manager, state } = useWeDo();

  const [running, setRunning] = useState(false);
  const [loadingPy, setLoadingPy] = useState(false);
  const [pyReady, setPyReady] = useState(() => isPyodideLoaded());
  const [showApi, setShowApi] = useState(true);
  const runtimeRef = useRef<ProgramRuntime | null>(null);

  useEffect(() => {
    return () => {
      void runtimeRef.current?.stop();
    };
  }, []);

  const handleRun = async () => {
    if (running) return;
    if (state.connectionMode === 'disconnected') {
      manager.connectSimulator();
    }

    const runtime = new ProgramRuntime(manager);
    runtimeRef.current = runtime;
    setRunning(true);

    if (!isPyodideLoaded()) {
      setLoadingPy(true);
      manager.emitLog('info', t.python.loadingRuntime);
    }

    try {
      await runPythonProgram(code, runtime, (level, msg) => {
        manager.emitLog(level, msg);
      });
      setPyReady(true);
    } catch (err) {
      if (!(err instanceof ProgramCancelledError)) {
        const msg = err instanceof Error ? err.message : String(err);
        manager.emitLog('error', `Python: ${msg}`);
      }
    } finally {
      setLoadingPy(false);
      setRunning(false);
      setPyReady(isPyodideLoaded());
      runtimeRef.current = null;
    }
  };

  const handleStop = async () => {
    if (runtimeRef.current) {
      await runtimeRef.current.stop();
      runtimeRef.current = null;
    }
    setRunning(false);
    setLoadingPy(false);
    manager.emitLog('info', lang === 'pl' ? 'Zatrzymano skrypt Pythona' : 'Python script stopped');
  };

  const apiSections =
    lang === 'pl'
      ? [
          {
            title: 'Silnik',
            items: [
              'await motor(power, port="auto")  # -100..100',
              'await motor_for(power, sec, brake=True)',
              'await ramp_motor(from_p, to_p, sec)',
              'await stop_motor(brake=True)',
            ],
          },
          {
            title: 'Czujnik odległości',
            items: [
              'distance()              # 0.0 – 10.0 (float)',
              'distance_cm()           # ok. cm',
              'motion_count()          # licznik obiektów',
              'await set_motion_mode("detect" | "count")',
              'await wait_distance("<", 3.5)',
              'await wait_distance_between(2.0, 5.0)',
            ],
          },
          {
            title: 'Czujnik przechyłu',
            items: [
              'tilt_x(), tilt_y()      # -45..+45°',
              'tilt_direction()        # flat/up/down/left/right',
              'crash_count()           # liczba wstrząsów',
              'await set_tilt_mode("angle" | "tilt" | "crash")',
              'await wait_tilt("right")',
            ],
          },
          {
            title: 'Hub (LED, Dźwięk, Zdarzenia)',
            items: [
              'await led_rgb(r, g, b)  # 0..255',
              'await led_hex("#ff00aa")',
              'await tone(freq_hz, ms)',
              'await note("C5", 300)',
              'await melody("startup" | "alarm" | "success")',
              'button_pressed(), battery()',
              'await wait(seconds)',
              'on_distance("<", 3.0, async_fn)',
              'on_button(async_fn)',
            ],
          },
        ]
      : [
          {
            title: 'Motor',
            items: [
              'await motor(power, port="auto")  # -100..100',
              'await motor_for(power, sec, brake=True)',
              'await ramp_motor(from_p, to_p, sec)',
              'await stop_motor(brake=True)',
            ],
          },
          {
            title: 'Motion / Distance Sensor',
            items: [
              'distance()              # 0.0 – 10.0 (float)',
              'distance_cm()           # approx. cm',
              'motion_count()          # object pass count',
              'await set_motion_mode("detect" | "count")',
              'await wait_distance("<", 3.5)',
              'await wait_distance_between(2.0, 5.0)',
            ],
          },
          {
            title: 'Tilt Sensor',
            items: [
              'tilt_x(), tilt_y()      # -45..+45°',
              'tilt_direction()        # flat/up/down/left/right',
              'crash_count()           # impact counter',
              'await set_tilt_mode("angle" | "tilt" | "crash")',
              'await wait_tilt("right")',
            ],
          },
          {
            title: 'Hub (LED, Sound, Events)',
            items: [
              'await led_rgb(r, g, b)  # 0..255',
              'await led_hex("#ff00aa")',
              'await tone(freq_hz, ms)',
              'await note("C5", 300)',
              'await melody("startup" | "alarm" | "success")',
              'button_pressed(), battery()',
              'await wait(seconds)',
              'on_distance("<", 3.0, async_fn)',
              'on_button(async_fn)',
            ],
          },
        ];

  return (
    <div className="flex flex-col h-full p-3 gap-3 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Terminal className="w-4 h-4 text-sky-400" />
            {t.python.title}
          </div>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full border ${
              loadingPy
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : pyReady
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {loadingPy
              ? t.python.loadingRuntime
              : pyReady
                ? t.python.ready
                : t.python.notLoaded}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5"
            value=""
            onChange={(e) => {
              const ex = PYTHON_EXAMPLES.find((x) => x.id === e.target.value);
              if (ex) onCodeChange(lang === 'pl' ? ex.codePl : ex.codeEn);
            }}
          >
            <option value="" disabled>
              {t.python.examples}...
            </option>
            {PYTHON_EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {lang === 'pl' ? ex.namePl : ex.nameEn}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowApi((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            {showApi ? t.python.hideHelp : t.python.apiHelp}
          </button>

          {!running ? (
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              {t.run}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40"
            >
              {loadingPy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Square className="w-4 h-4 fill-current" />
              )}
              {t.stop}
            </button>
          )}
        </div>
      </div>

      {/* Main Editor + API Docs Split */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 rounded-xl overflow-hidden border border-slate-800 bg-[#282c34]">
          <div className="px-3 py-1.5 text-[11px] bg-slate-900/90 border-b border-slate-800 text-slate-400">
            {t.python.hint}
          </div>
          <div className="flex-1 overflow-auto">
            <CodeMirror
              value={code}
              height="100%"
              theme={oneDark}
              extensions={[python()]}
              onChange={(val) => onCodeChange(val)}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                autocompletion: true,
                bracketMatching: true,
                indentOnInput: true,
              }}
              className="h-full text-sm"
            />
          </div>
        </div>

        {showApi && (
          <aside className="w-80 shrink-0 hidden lg:flex flex-col bg-slate-900/80 border border-slate-800 rounded-xl p-3 overflow-y-auto gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
              {t.python.apiHelp}
            </h3>
            {apiSections.map((sec) => (
              <div key={sec.title} className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-200">{sec.title}</div>
                <div className="space-y-1">
                  {sec.items.map((line) => (
                    <div
                      key={line}
                      className="text-[11px] font-mono bg-slate-950/90 border border-slate-800/80 rounded px-2 py-1 text-sky-200/90 select-all"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
};

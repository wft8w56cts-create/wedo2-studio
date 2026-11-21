import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import {
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Play,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { getT } from '../../i18n/translations';
import {
  compareDistance,
  ProgramCancelledError,
  ProgramRuntime,
} from '../../runtime/executionContext';
import { Language } from '../../types/wedo';
import { useWeDo } from '../../wedo/useWeDo';
import { registerWeDoBlocks } from './blocks';
import { BLOCKLY_EXAMPLES } from './examples';
import { generateBlocklyExecutionJs, generateBlocklyPython } from './generators';
import { createToolbox } from './toolbox';

interface Props {
  lang: Language;
  onExportToPython: (code: string) => void;
}

const STORAGE_KEY = 'wedo2_blockly_workspace_v1';

const darkTheme = Blockly.Theme.defineTheme('wedoDark', {
  name: 'wedoDark',
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: '#0b1120',
    toolboxBackgroundColour: '#0f172a',
    toolboxForegroundColour: '#e2e8f0',
    flyoutBackgroundColour: '#1e293b',
    flyoutForegroundColour: '#f1f5f9',
    flyoutOpacity: 0.96,
    scrollbarColour: '#334155',
    insertionMarkerColour: '#38bdf8',
    insertionMarkerOpacity: 0.5,
  },
});

export const BlocklyMode: React.FC<Props> = ({ lang, onExportToPython }) => {
  const t = getT(lang);
  const { manager, state } = useWeDo();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const runtimeRef = useRef<ProgramRuntime | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [running, setRunning] = useState(false);
  const [pythonModal, setPythonModal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    registerWeDoBlocks(lang);
    const el = containerRef.current;
    if (!el) return;

    // Preserve current blocks when switching language
    let serialized: Record<string, unknown> | null = null;
    if (workspaceRef.current) {
      serialized = Blockly.serialization.workspaces.save(workspaceRef.current);
      workspaceRef.current.dispose();
    } else {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) serialized = JSON.parse(saved);
      } catch {
        // ignore
      }
    }

    const ws = Blockly.inject(el, {
      toolbox: createToolbox(lang),
      theme: darkTheme,
      grid: { spacing: 24, length: 3, colour: '#1e293b', snap: true },
      zoom: { controls: true, wheel: true, startScale: 0.95, maxScale: 1.8, minScale: 0.4 },
      trashcan: true,
      renderer: 'zelos',
    });

    workspaceRef.current = ws;

    if (serialized) {
      try {
        Blockly.serialization.workspaces.load(serialized, ws);
      } catch {
        Blockly.serialization.workspaces.load(BLOCKLY_EXAMPLES[0].workspace, ws);
      }
    } else {
      Blockly.serialization.workspaces.load(BLOCKLY_EXAMPLES[0].workspace, ws);
    }

    const onChange = () => {
      try {
        const data = Blockly.serialization.workspaces.save(ws);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
    };
    ws.addChangeListener(onChange);

    const resizeObserver = new ResizeObserver(() => Blockly.svgResize(ws));
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      ws.removeChangeListener(onChange);
    };
  }, [lang]);

  useEffect(() => {
    return () => {
      void runtimeRef.current?.stop();
      workspaceRef.current?.dispose();
      workspaceRef.current = null;
    };
  }, []);

  const handleRun = async () => {
    if (running || !workspaceRef.current) return;
    if (state.connectionMode === 'disconnected') {
      manager.connectSimulator();
    }

    const code = generateBlocklyExecutionJs(workspaceRef.current);
    const runtime = new ProgramRuntime(manager);
    runtimeRef.current = runtime;
    setRunning(true);
    manager.emitLog('info', lang === 'pl' ? 'Uruchomiono program Blockly' : 'Started Blockly program');

    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const wrapped = `${code}\nawait __rt.waitForAllTasks();`;
      const fn = new AsyncFunction('__rt', '__cmp', wrapped);
      await fn(runtime, compareDistance);
    } catch (err) {
      if (!(err instanceof ProgramCancelledError)) {
        manager.emitLog('error', `Blockly error: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setRunning(false);
      runtimeRef.current = null;
    }
  };

  const handleStop = async () => {
    if (runtimeRef.current) {
      await runtimeRef.current.stop();
      runtimeRef.current = null;
    }
    setRunning(false);
    manager.emitLog('info', lang === 'pl' ? 'Zatrzymano Blockly' : 'Stopped Blockly');
  };

  const handleLoadExample = (id: string) => {
    const ex = BLOCKLY_EXAMPLES.find((e) => e.id === id);
    if (ex && workspaceRef.current) {
      workspaceRef.current.clear();
      Blockly.serialization.workspaces.load(ex.workspace, workspaceRef.current);
    }
  };

  const handleExportJson = () => {
    if (!workspaceRef.current) return;
    const data = Blockly.serialization.workspaces.save(workspaceRef.current);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedo2-project.wedo.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspaceRef.current) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        workspaceRef.current!.clear();
        Blockly.serialization.workspaces.load(parsed, workspaceRef.current!);
      } catch (err) {
        manager.emitLog('error', `Invalid JSON file: ${String(err)}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleOpenPython = () => {
    if (!workspaceRef.current) return;
    const py = generateBlocklyPython(workspaceRef.current);
    onExportToPython(py);
  };

  return (
    <div className="flex flex-col h-full p-3 gap-3 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5"
            value=""
            onChange={(e) => handleLoadExample(e.target.value)}
          >
            <option value="" disabled>
              {t.blockly.examples}...
            </option>
            {BLOCKLY_EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {lang === 'pl' ? ex.namePl : ex.nameEn}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              if (workspaceRef.current) {
                setPythonModal(generateBlocklyPython(workspaceRef.current));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition"
          >
            <Code2 className="w-3.5 h-3.5" />
            {t.blockly.previewPython}
          </button>

          <button
            onClick={handleOpenPython}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/40 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t.blockly.openInPython}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            {t.blockly.saveJson}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            <Upload className="w-3.5 h-3.5" />
            {t.blockly.loadJson}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJson}
            className="hidden"
          />
          <button
            onClick={() => workspaceRef.current?.clear()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t.blockly.clear}
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
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 animate-pulse"
            >
              <Square className="w-4 h-4 fill-current" />
              {t.stop}
            </button>
          )}
        </div>
      </div>

      {/* Blockly Workspace */}
      <div
        ref={containerRef}
        className="flex-1 rounded-xl overflow-hidden border border-slate-800 min-h-[360px]"
      />

      {/* Python Preview Modal */}
      {pythonModal !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-400" />
                {t.blockly.pythonPreviewTitle}
              </span>
              <button
                onClick={() => setPythonModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-sky-200 bg-slate-950 overflow-auto max-h-[60vh]">
              {pythonModal}
            </pre>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-800">
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(pythonModal);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t.blockly.copied : t.blockly.copy}
              </button>
              <button
                onClick={() => {
                  const code = pythonModal;
                  setPythonModal(null);
                  onExportToPython(code);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t.blockly.openInPython}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

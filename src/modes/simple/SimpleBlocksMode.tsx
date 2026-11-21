import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Cog,
  Compass,
  Hand,
  Infinity as InfinityIcon,
  Lightbulb,
  Music,
  OctagonX,
  Play,
  Plus,
  Radar,
  Repeat,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  Zap,
} from 'lucide-react';
import { getT } from '../../i18n/translations';
import { CompareOp, ProgramCancelledError, ProgramRuntime } from '../../runtime/executionContext';
import { Language, TiltDirection } from '../../types/wedo';
import { MELODIES } from '../../wedo/protocol';
import { useWeDo } from '../../wedo/useWeDo';
import { SIMPLE_EXAMPLES } from './examples';
import { runSimpleStacks } from './runner';
import { SimpleBlock, SimpleStack, SimpleTrigger } from './types';

interface Props {
  lang: Language;
}

const STORAGE_KEY = 'wedo2_simple_stacks_v1';

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function createDefaultBlock(type: SimpleBlock['type']): SimpleBlock {
  const id = uid();
  switch (type) {
    case 'motor':
      return { id, type: 'motor', power: 70, port: 'auto' };
    case 'stopMotor':
      return { id, type: 'stopMotor', brake: true, port: 'auto' };
    case 'led':
      return { id, type: 'led', hex: '#22c55e' };
    case 'tone':
      return { id, type: 'tone', freq: 523, durationMs: 300 };
    case 'melody':
      return { id, type: 'melody', melody: 'startup' };
    case 'wait':
      return { id, type: 'wait', seconds: 1.0 };
    case 'waitDistance':
      return { id, type: 'waitDistance', op: '<', valueA: 3.5, valueB: 6.0 };
    case 'waitTilt':
      return { id, type: 'waitTilt', direction: 'right' };
    case 'waitButton':
      return { id, type: 'waitButton' };
    case 'repeat':
      return { id, type: 'repeat', times: 3 };
    case 'forever':
      return { id, type: 'forever' };
    case 'endLoop':
      return { id, type: 'endLoop' };
  }
}

export const SimpleBlocksMode: React.FC<Props> = ({ lang }) => {
  const t = getT(lang);
  const { manager, state } = useWeDo();

  const [stacks, setStacks] = useState<SimpleStack[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return SIMPLE_EXAMPLES[0].stacks;
  });

  const [running, setRunning] = useState(false);
  const [activeBlocks, setActiveBlocks] = useState<Record<string, string | null>>({});
  const [selectedStackId, setSelectedStackId] = useState<string>(stacks[0]?.id ?? '');
  const runtimeRef = useRef<ProgramRuntime | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stacks));
    } catch {
      // ignore quota
    }
  }, [stacks]);

  useEffect(() => {
    if (!stacks.some((s) => s.id === selectedStackId) && stacks.length > 0) {
      setSelectedStackId(stacks[0].id);
    }
  }, [stacks, selectedStackId]);

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
    setActiveBlocks({});
    manager.emitLog('info', lang === 'pl' ? 'Uruchomiono Proste klocki' : 'Started Simple Blocks');

    try {
      await runSimpleStacks(stacks, runtime, (stackId, blockId) => {
        setActiveBlocks((prev) => ({ ...prev, [stackId]: blockId }));
      });
    } catch (err) {
      if (!(err instanceof ProgramCancelledError)) {
        manager.emitLog('error', String(err));
      }
    } finally {
      setRunning(false);
      setActiveBlocks({});
      runtimeRef.current = null;
    }
  };

  const handleStop = async () => {
    if (runtimeRef.current) {
      await runtimeRef.current.stop();
      runtimeRef.current = null;
    }
    setRunning(false);
    setActiveBlocks({});
    manager.emitLog('info', lang === 'pl' ? 'Zatrzymano program' : 'Program stopped');
  };

  const addStack = () => {
    const newStack: SimpleStack = {
      id: uid(),
      trigger: { type: 'distance', op: '<', valueA: 3.0, valueB: 6.0 },
      blocks: [createDefaultBlock('led'), createDefaultBlock('tone')],
    };
    setStacks((prev) => [...prev, newStack]);
    setSelectedStackId(newStack.id);
  };

  const removeStack = (id: string) => {
    setStacks((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  };

  const updateTrigger = (stackId: string, trigger: SimpleTrigger) => {
    setStacks((prev) => prev.map((s) => (s.id === stackId ? { ...s, trigger } : s)));
  };

  const addBlockToSelected = (type: SimpleBlock['type']) => {
    const targetId = selectedStackId || stacks[0]?.id;
    if (!targetId) return;
    const block = createDefaultBlock(type);
    setStacks((prev) =>
      prev.map((s) => (s.id === targetId ? { ...s, blocks: [...s.blocks, block] } : s))
    );
  };

  const updateBlock = (stackId: string, blockId: string, patch: Partial<SimpleBlock>) => {
    setStacks((prev) =>
      prev.map((s) =>
        s.id === stackId
          ? {
              ...s,
              blocks: s.blocks.map((b) =>
                b.id === blockId ? ({ ...b, ...patch } as SimpleBlock) : b
              ),
            }
          : s
      )
    );
  };

  const moveBlock = (stackId: string, index: number, dir: -1 | 1) => {
    setStacks((prev) =>
      prev.map((s) => {
        if (s.id !== stackId) return s;
        const target = index + dir;
        if (target < 0 || target >= s.blocks.length) return s;
        const next = [...s.blocks];
        [next[index], next[target]] = [next[target], next[index]];
        return { ...s, blocks: next };
      })
    );
  };

  const deleteBlock = (stackId: string, blockId: string) => {
    setStacks((prev) =>
      prev.map((s) =>
        s.id === stackId ? { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) } : s
      )
    );
  };

  const paletteItems: Array<{
    type: SimpleBlock['type'];
    label: string;
    color: string;
    icon: React.ReactNode;
  }> = [
    { type: 'motor', label: t.simple.blocks.motor, color: 'bg-emerald-600 hover:bg-emerald-500', icon: <Cog className="w-4 h-4" /> },
    { type: 'stopMotor', label: t.simple.blocks.stopMotor, color: 'bg-rose-600 hover:bg-rose-500', icon: <OctagonX className="w-4 h-4" /> },
    { type: 'led', label: t.simple.blocks.led, color: 'bg-fuchsia-600 hover:bg-fuchsia-500', icon: <Lightbulb className="w-4 h-4" /> },
    { type: 'tone', label: t.simple.blocks.tone, color: 'bg-violet-600 hover:bg-violet-500', icon: <Volume2 className="w-4 h-4" /> },
    { type: 'melody', label: t.simple.blocks.melody, color: 'bg-indigo-600 hover:bg-indigo-500', icon: <Music className="w-4 h-4" /> },
    { type: 'wait', label: t.simple.blocks.wait, color: 'bg-amber-600 hover:bg-amber-500', icon: <Clock className="w-4 h-4" /> },
    { type: 'waitDistance', label: t.simple.blocks.waitDistance, color: 'bg-sky-600 hover:bg-sky-500', icon: <Radar className="w-4 h-4" /> },
    { type: 'waitTilt', label: t.simple.blocks.waitTilt, color: 'bg-cyan-600 hover:bg-cyan-500', icon: <Compass className="w-4 h-4" /> },
    { type: 'waitButton', label: t.simple.blocks.waitButton, color: 'bg-teal-600 hover:bg-teal-500', icon: <Hand className="w-4 h-4" /> },
    { type: 'repeat', label: t.simple.blocks.repeat, color: 'bg-orange-600 hover:bg-orange-500', icon: <Repeat className="w-4 h-4" /> },
    { type: 'forever', label: t.simple.blocks.forever, color: 'bg-orange-700 hover:bg-orange-600', icon: <InfinityIcon className="w-4 h-4" /> },
    { type: 'endLoop', label: t.simple.blocks.endLoop, color: 'bg-slate-600 hover:bg-slate-500', icon: <Square className="w-3.5 h-3.5" /> },
  ];

  const blockAccent = (type: SimpleBlock['type']): string => {
    switch (type) {
      case 'motor':
        return 'border-emerald-500/60 bg-emerald-950/50';
      case 'stopMotor':
        return 'border-rose-500/60 bg-rose-950/50';
      case 'led':
        return 'border-fuchsia-500/60 bg-fuchsia-950/50';
      case 'tone':
      case 'melody':
        return 'border-violet-500/60 bg-violet-950/50';
      case 'wait':
        return 'border-amber-500/60 bg-amber-950/50';
      case 'waitDistance':
      case 'waitTilt':
      case 'waitButton':
        return 'border-sky-500/60 bg-sky-950/50';
      case 'repeat':
      case 'forever':
      case 'endLoop':
        return 'border-orange-500/60 bg-orange-950/50';
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 overflow-hidden">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {t.simple.title}
          </h2>
          <p className="text-xs text-slate-400">{t.simple.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value=""
            onChange={(e) => {
              const ex = SIMPLE_EXAMPLES.find((x) => x.id === e.target.value);
              if (ex) {
                setStacks(JSON.parse(JSON.stringify(ex.stacks)));
                setSelectedStackId(ex.stacks[0].id);
              }
            }}
          >
            <option value="" disabled>
              {t.simple.examples}...
            </option>
            {SIMPLE_EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {lang === 'pl' ? ex.namePl : ex.nameEn}
              </option>
            ))}
          </select>

          <button
            onClick={addStack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.simple.addStack}
          </button>

          {!running ? (
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              {t.run}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 transition animate-pulse"
            >
              <Square className="w-4 h-4 fill-current" />
              {t.stop}
            </button>
          )}
        </div>
      </div>

      {/* Block Palette */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
          {t.simple.addBlock} →{' '}
          <span className="text-blue-400">
            #{stacks.findIndex((s) => s.id === selectedStackId) + 1}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {paletteItems.map((item) => (
            <button
              key={item.type}
              onClick={() => addBlockToSelected(item.type)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white transition shadow-sm ${item.color}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Parallel Stacks Canvas */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {stacks.map((stack, sIdx) => {
          const isSelected = stack.id === selectedStackId;
          const activeId = activeBlocks[stack.id];

          return (
            <div
              key={stack.id}
              onClick={() => setSelectedStackId(stack.id)}
              className={`rounded-xl border p-3.5 transition cursor-pointer ${
                isSelected
                  ? 'border-blue-500/70 bg-slate-900/95 ring-1 ring-blue-500/30'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              {/* Stack Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    #{sIdx + 1}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    {lang === 'pl' ? 'Wyzwalacz + sekwencja' : 'Trigger + sequence'}
                  </span>
                </div>
                {stacks.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStack(stack.id);
                    }}
                    className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-950/40 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.simple.deleteStack}
                  </button>
                )}
              </div>

              {/* Horizontal Flow */}
              <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
                {/* Trigger Hat Block */}
                <div className="shrink-0 w-52 rounded-xl border-2 border-yellow-500/70 bg-yellow-950/40 p-2.5 flex flex-col justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-300">
                    <Zap className="w-4 h-4 shrink-0" />
                    <select
                      className="w-full bg-slate-900/90 border border-yellow-600/40 rounded px-1.5 py-1 text-xs text-yellow-100"
                      value={stack.trigger.type}
                      onChange={(e) => {
                        const val = e.target.value as SimpleTrigger['type'];
                        if (val === 'start') updateTrigger(stack.id, { type: 'start' });
                        else if (val === 'distance')
                          updateTrigger(stack.id, {
                            type: 'distance',
                            op: '<',
                            valueA: 3.0,
                            valueB: 6.0,
                          });
                        else if (val === 'tilt')
                          updateTrigger(stack.id, { type: 'tilt', direction: 'right' });
                        else if (val === 'crash') updateTrigger(stack.id, { type: 'crash' });
                        else updateTrigger(stack.id, { type: 'button' });
                      }}
                    >
                      <option value="start">{t.simple.triggers.start}</option>
                      <option value="distance">{t.simple.triggers.distance}</option>
                      <option value="tilt">{t.simple.triggers.tilt}</option>
                      <option value="crash">{t.simple.triggers.crash}</option>
                      <option value="button">{t.simple.triggers.button}</option>
                    </select>
                  </div>

                  {stack.trigger.type === 'distance' && (() => {
                    const distTrig = stack.trigger;
                    return (
                      <div className="flex items-center gap-1 text-xs">
                        <select
                          className="bg-slate-900 border border-slate-700 rounded px-1 py-1 text-slate-100"
                          value={distTrig.op}
                          onChange={(e) =>
                            updateTrigger(stack.id, {
                              ...distTrig,
                              op: e.target.value as CompareOp,
                            })
                          }
                        >
                          <option value="<">&lt;</option>
                          <option value=">">&gt;</option>
                          <option value="between">{t.simple.between}</option>
                        </select>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={distTrig.valueA}
                          onChange={(e) =>
                            updateTrigger(stack.id, {
                              ...distTrig,
                              valueA: Number(e.target.value),
                            })
                          }
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center text-white"
                        />
                        {distTrig.op === 'between' && (
                          <>
                            <span className="text-slate-400">–</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="10"
                              value={distTrig.valueB}
                              onChange={(e) =>
                                updateTrigger(stack.id, {
                                  ...distTrig,
                                  valueB: Number(e.target.value),
                                })
                              }
                              className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center text-white"
                            />
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {stack.trigger.type === 'tilt' && (
                    <select
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      value={stack.trigger.direction}
                      onChange={(e) =>
                        updateTrigger(stack.id, {
                          type: 'tilt',
                          direction: e.target.value as TiltDirection,
                        })
                      }
                    >
                      {(['up', 'down', 'left', 'right', 'flat'] as TiltDirection[]).map((d) => (
                        <option key={d} value={d}>
                          {t.sensors.directions[d]}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Action Blocks */}
                {stack.blocks.map((block, bIdx) => {
                  const isActive = activeId === block.id;
                  return (
                    <div
                      key={block.id}
                      className={`shrink-0 min-w-[148px] rounded-xl border-2 p-2.5 flex flex-col justify-between gap-2 transition-all ${blockAccent(
                        block.type
                      )} ${isActive ? 'ring-2 ring-white scale-[1.03] shadow-lg shadow-blue-500/30' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-200 truncate">
                          {t.simple.blocks[block.type]}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => moveBlock(stack.id, bIdx, -1)}
                            disabled={bIdx === 0}
                            className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveBlock(stack.id, bIdx, 1)}
                            disabled={bIdx === stack.blocks.length - 1}
                            className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteBlock(stack.id, block.id)}
                            className="p-0.5 rounded hover:bg-rose-500/30 text-slate-300 hover:text-rose-200"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Block-specific controls */}
                      {block.type === 'motor' && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-emerald-300 font-mono font-bold">
                              {block.power > 0 ? `+${block.power}` : block.power}%
                            </span>
                            <select
                              value={block.port}
                              onChange={(e) =>
                                updateBlock(stack.id, block.id, {
                                  port: e.target.value as 'auto' | 'A' | 'B',
                                })
                              }
                              className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[10px]"
                            >
                              <option value="auto">Auto</option>
                              <option value="A">A</option>
                              <option value="B">B</option>
                            </select>
                          </div>
                          <input
                            type="range"
                            min={-100}
                            max={100}
                            step={5}
                            value={block.power}
                            onChange={(e) =>
                              updateBlock(stack.id, block.id, { power: Number(e.target.value) })
                            }
                            className="w-full accent-emerald-400"
                          />
                        </div>
                      )}

                      {block.type === 'stopMotor' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateBlock(stack.id, block.id, { brake: true })}
                            className={`flex-1 text-[11px] py-1 rounded font-medium ${
                              block.brake ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            {t.simple.brake}
                          </button>
                          <button
                            onClick={() => updateBlock(stack.id, block.id, { brake: false })}
                            className={`flex-1 text-[11px] py-1 rounded font-medium ${
                              !block.brake ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            {t.simple.drift}
                          </button>
                        </div>
                      )}

                      {block.type === 'led' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={block.hex}
                            onChange={(e) =>
                              updateBlock(stack.id, block.id, { hex: e.target.value })
                            }
                            className="w-9 h-7 rounded cursor-pointer bg-transparent border-0"
                          />
                          <span className="text-xs font-mono text-slate-300 uppercase">
                            {block.hex}
                          </span>
                        </div>
                      )}

                      {block.type === 'tone' && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <input
                            type="number"
                            min={100}
                            max={3000}
                            step={20}
                            value={block.freq}
                            onChange={(e) =>
                              updateBlock(stack.id, block.id, { freq: Number(e.target.value) })
                            }
                            className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center"
                          />
                          <span className="text-slate-400 text-[10px]">Hz</span>
                          <input
                            type="number"
                            min={50}
                            max={3000}
                            step={50}
                            value={block.durationMs}
                            onChange={(e) =>
                              updateBlock(stack.id, block.id, {
                                durationMs: Number(e.target.value),
                              })
                            }
                            className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center"
                          />
                          <span className="text-slate-400 text-[10px]">ms</span>
                        </div>
                      )}

                      {block.type === 'melody' && (
                        <select
                          value={block.melody}
                          onChange={(e) =>
                            updateBlock(stack.id, block.id, { melody: e.target.value })
                          }
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                        >
                          {Object.entries(MELODIES).map(([k, m]) => (
                            <option key={k} value={k}>
                              {lang === 'pl' ? m.namePl : m.nameEn}
                            </option>
                          ))}
                        </select>
                      )}

                      {block.type === 'wait' && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0.1}
                            max={60}
                            step={0.1}
                            value={block.seconds}
                            onChange={(e) =>
                              updateBlock(stack.id, block.id, { seconds: Number(e.target.value) })
                            }
                            className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-center"
                          />
                          <span className="text-xs text-slate-400">s</span>
                        </div>
                      )}

                      {block.type === 'waitDistance' && (
                        <div className="flex items-center gap-1 text-xs">
                          <select
                            value={block.op}
                            onChange={(e) =>
                              updateBlock(stack.id, block.id, {
                                op: e.target.value as CompareOp,
                              })
                            }
                            className="bg-slate-900 border border-slate-700 rounded px-1 py-1"
                          >
                            <option value="<">&lt;</option>
                            <option value=">">&gt;</option>
                            <option value="between">{t.simple.between}</option>
                          </select>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="10"
                            value={block.valueA}
                            onChange={(e) =>
                              updateBlock(stack.id, block.id, { valueA: Number(e.target.value) })
                            }
                            className="w-14 bg-slate-900 border border-slate-700 rounded px-1 py-1 text-center"
                          />
                          {block.op === 'between' && (
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="10"
                              value={block.valueB}
                              onChange={(e) =>
                                updateBlock(stack.id, block.id, { valueB: Number(e.target.value) })
                              }
                              className="w-14 bg-slate-900 border border-slate-700 rounded px-1 py-1 text-center"
                            />
                          )}
                        </div>
                      )}

                      {block.type === 'waitTilt' && (
                        <select
                          value={block.direction}
                          onChange={(e) =>
                            updateBlock(stack.id, block.id, {
                              direction: e.target.value as TiltDirection,
                            })
                          }
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                        >
                          {(['up', 'down', 'left', 'right', 'flat'] as TiltDirection[]).map((d) => (
                            <option key={d} value={d}>
                              {t.sensors.directions[d]}
                            </option>
                          ))}
                        </select>
                      )}

                      {block.type === 'repeat' && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={block.times}
                            onChange={(e) =>
                              updateBlock(stack.id, block.id, { times: Number(e.target.value) })
                            }
                            className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center"
                          />
                          <span className="text-slate-400">×</span>
                        </div>
                      )}

                      {(block.type === 'waitButton' ||
                        block.type === 'forever' ||
                        block.type === 'endLoop') && (
                        <div className="text-[11px] text-slate-400 italic">
                          {block.type === 'forever'
                            ? '∞'
                            : block.type === 'endLoop'
                              ? '↩'
                              : lang === 'pl'
                                ? 'Naciśnij Hub'
                                : 'Press Hub'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Terminal, Trash2 } from 'lucide-react';
import { getT } from '../i18n/translations';
import { Language } from '../types/wedo';
import { useWeDo } from '../wedo/useWeDo';

interface Props {
  lang: Language;
}

export const ConsolePanel: React.FC<Props> = ({ lang }) => {
  const t = getT(lang);
  const { logs, clearLogs } = useWeDo();
  const [open, setOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, open]);

  const badgeStyle = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-rose-400';
      case 'warn':
        return 'text-amber-400';
      case 'sensor':
        return 'text-cyan-400';
      case 'python':
        return 'text-emerald-400';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="bg-slate-950 border-t border-slate-800 shrink-0">
      <div
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/80 select-none"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          {t.console.title}
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
            {logs.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearLogs();
              }}
              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800"
            >
              <Trash2 className="w-3 h-3" />
              {t.console.clear}
            </button>
          )}
          {open ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {open && (
        <div className="h-28 overflow-y-auto px-4 py-2 font-mono text-[11px] space-y-1 bg-slate-950/95">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">{t.console.empty}</div>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2 leading-snug">
                <span className="text-slate-600 shrink-0">[{entry.time}]</span>
                <span className={`uppercase text-[10px] w-14 shrink-0 ${badgeStyle(entry.level)}`}>
                  {entry.level}
                </span>
                <span className="text-slate-200 whitespace-pre-wrap break-all">
                  {entry.message}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

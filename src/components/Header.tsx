import React from 'react';
import {
  Battery,
  Bluetooth,
  BluetoothOff,
  Blocks,
  Code2,
  Cpu,
  Gauge,
  Globe,
  Loader2,
  Puzzle,
  Radio,
} from 'lucide-react';
import { getT } from '../i18n/translations';
import { AppMode, Language } from '../types/wedo';
import { rgbToHex } from '../wedo/protocol';
import { useWeDo } from '../wedo/useWeDo';

interface Props {
  lang: Language;
  onLangChange: (lang: Language) => void;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  showSimPanel: boolean;
  onToggleSimPanel: () => void;
}

export const Header: React.FC<Props> = ({
  lang,
  onLangChange,
  mode,
  onModeChange,
  showSimPanel,
  onToggleSimPanel,
}) => {
  const t = getT(lang);
  const { state, manager } = useWeDo();

  const tabs: Array<{ id: AppMode; label: string; icon: React.ReactNode }> = [
    { id: 'simple', label: t.tabs.simple, icon: <Puzzle className="w-4 h-4" /> },
    { id: 'blockly', label: t.tabs.blockly, icon: <Blocks className="w-4 h-4" /> },
    { id: 'python', label: t.tabs.python, icon: <Code2 className="w-4 h-4" /> },
    { id: 'control', label: t.tabs.control, icon: <Gauge className="w-4 h-4" /> },
  ];

  const handleConnectBt = async () => {
    try {
      await manager.connectBluetooth();
    } catch {
      // error already logged to state/console
    }
  };

  const handleSimulator = () => {
    if (state.connectionMode !== 'simulator') {
      manager.connectSimulator();
      if (!showSimPanel) onToggleSimPanel();
    } else {
      onToggleSimPanel();
    }
  };

  const ledHex = rgbToHex(state.ledColor);

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-20">
      {/* Brand + Mode Tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/50 relative">
            <Cpu className="w-4 h-4 text-white" />
            {state.connectionMode !== 'disconnected' && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900"
                style={{ backgroundColor: ledHex }}
              />
            )}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-white tracking-tight">{t.appTitle}</div>
            <div className="text-[10px] text-slate-400 font-medium">{t.appSubtitle}</div>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onModeChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                mode === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Hardware Connection & Language */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Live Mini Status Pill */}
        {state.connectionMode !== 'disconnected' && state.connectionMode !== 'connecting' && (
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px]">
            <span
              className={`flex items-center gap-1 font-semibold ${
                state.connectionMode === 'bluetooth' ? 'text-sky-400' : 'text-amber-400'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {state.connectionMode === 'bluetooth' ? t.connectedBt : t.connectedSim}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-mono">
              D:{state.distance.toFixed(1)}
            </span>
            <span className="text-slate-300 font-mono">
              T:{state.tiltX}°/{state.tiltY}°
            </span>
            {state.battery !== null && (
              <span className="flex items-center gap-0.5 text-emerald-400 font-mono">
                <Battery className="w-3.5 h-3.5" />
                {state.battery}%
              </span>
            )}
          </div>
        )}

        {/* Connect Web Bluetooth */}
        {state.connectionMode !== 'bluetooth' && (
          <button
            onClick={() => void handleConnectBt()}
            disabled={state.connectionMode === 'connecting'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white shadow-md shadow-blue-900/40 transition"
          >
            {state.connectionMode === 'connecting' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Bluetooth className="w-3.5 h-3.5" />
            )}
            {state.connectionMode === 'connecting' ? t.connecting : t.connectHub}
          </button>
        )}

        {/* Simulator Button */}
        <button
          onClick={handleSimulator}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            state.connectionMode === 'simulator'
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          {t.simulator}
        </button>

        {/* Disconnect */}
        {state.connectionMode !== 'disconnected' && (
          <button
            onClick={() => void manager.disconnect()}
            title={t.disconnect}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-rose-950/70 text-slate-300 hover:text-rose-300 border border-slate-700 transition"
          >
            <BluetoothOff className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t.disconnect}</span>
          </button>
        )}

        {/* Language Toggle */}
        <button
          onClick={() => onLangChange(lang === 'pl' ? 'en' : 'pl')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          title="Switch language PL / EN"
        >
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          {lang.toUpperCase()}
        </button>
      </div>
    </header>
  );
};

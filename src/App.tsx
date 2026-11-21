import React, { useEffect, useState } from 'react';
import { ConsolePanel } from './components/ConsolePanel';
import { Header } from './components/Header';
import { SimulatorDrawer } from './components/SimulatorDrawer';
import { BlocklyMode } from './modes/blockly/BlocklyMode';
import { ControlTelemetryMode } from './modes/control/ControlTelemetryMode';
import { PYTHON_EXAMPLES } from './modes/python/examples';
import { PythonMode } from './modes/python/PythonMode';
import { SimpleBlocksMode } from './modes/simple/SimpleBlocksMode';
import { AppMode, Language } from './types/wedo';
import { useWeDo, WeDoProvider } from './wedo/useWeDo';

const LANG_KEY = 'wedo2_lang_v1';
const PYTHON_CODE_KEY = 'wedo2_python_code_v1';

const StudioShell: React.FC = () => {
  const { state } = useWeDo();

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === 'en' ? 'en' : 'pl';
  });

  const [mode, setMode] = useState<AppMode>('blockly');
  const [showSimPanel, setShowSimPanel] = useState(false);

  const [pythonCode, setPythonCode] = useState<string>(() => {
    const saved = localStorage.getItem(PYTHON_CODE_KEY);
    return saved || PYTHON_EXAMPLES[0].codePl;
  });

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(PYTHON_CODE_KEY, pythonCode);
  }, [pythonCode]);

  useEffect(() => {
    if (state.connectionMode === 'simulator') {
      setShowSimPanel(true);
    }
  }, [state.connectionMode]);

  const handleExportToPython = (code: string) => {
    setPythonCode(code);
    setMode('python');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      <Header
        lang={lang}
        onLangChange={setLang}
        mode={mode}
        onModeChange={setMode}
        showSimPanel={showSimPanel}
        onToggleSimPanel={() => setShowSimPanel((v) => !v)}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 min-w-0 h-full overflow-hidden">
          {mode === 'simple' && <SimpleBlocksMode lang={lang} />}
          {mode === 'blockly' && (
            <BlocklyMode lang={lang} onExportToPython={handleExportToPython} />
          )}
          {mode === 'python' && (
            <PythonMode lang={lang} code={pythonCode} onCodeChange={setPythonCode} />
          )}
          {mode === 'control' && <ControlTelemetryMode lang={lang} />}
        </main>

        {showSimPanel && state.connectionMode === 'simulator' && (
          <SimulatorDrawer lang={lang} onClose={() => setShowSimPanel(false)} />
        )}
      </div>

      <ConsolePanel lang={lang} />
    </div>
  );
};

export const App: React.FC = () => (
  <WeDoProvider>
    <StudioShell />
  </WeDoProvider>
);

export default App;

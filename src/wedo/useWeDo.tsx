import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { LogEntry, TelemetryPoint, WeDoHubState } from '../types/wedo';
import { wedoManager, WeDoHubManager } from './hubController';

interface WeDoContextValue {
  state: WeDoHubState;
  telemetry: TelemetryPoint[];
  logs: LogEntry[];
  manager: WeDoHubManager;
  clearLogs: () => void;
}

const WeDoContext = createContext<WeDoContextValue | null>(null);

const MAX_TELEMETRY = 90;
const MAX_LOGS = 150;

export const WeDoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WeDoHubState>(() => wedoManager.getState());
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const unsubState = wedoManager.subscribeState(setState);
    const unsubLog = wedoManager.subscribeLogs((entry) => {
      setLogs((prev) => [...prev.slice(-(MAX_LOGS - 1)), entry]);
    });
    const unsubTelemetry = wedoManager.subscribeTelemetry((pt) => {
      setTelemetry((prev) => [...prev.slice(-(MAX_TELEMETRY - 1)), pt]);
    });
    return () => {
      unsubState();
      unsubLog();
      unsubTelemetry();
    };
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return (
    <WeDoContext.Provider value={{ state, telemetry, logs, manager: wedoManager, clearLogs }}>
      {children}
    </WeDoContext.Provider>
  );
};

export function useWeDo(): WeDoContextValue {
  const ctx = useContext(WeDoContext);
  if (!ctx) {
    throw new Error('useWeDo must be used inside WeDoProvider');
  }
  return ctx;
}

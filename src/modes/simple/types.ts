import { CompareOp } from '../../runtime/executionContext';
import { PortSelection, TiltDirection } from '../../types/wedo';

export type SimpleTrigger =
  | { type: 'start' }
  | { type: 'distance'; op: CompareOp; valueA: number; valueB: number }
  | { type: 'tilt'; direction: TiltDirection }
  | { type: 'crash' }
  | { type: 'button' };

export type SimpleBlock =
  | { id: string; type: 'motor'; power: number; port: PortSelection }
  | { id: string; type: 'stopMotor'; brake: boolean; port: PortSelection }
  | { id: string; type: 'led'; hex: string }
  | { id: string; type: 'tone'; freq: number; durationMs: number }
  | { id: string; type: 'melody'; melody: string }
  | { id: string; type: 'wait'; seconds: number }
  | { id: string; type: 'waitDistance'; op: CompareOp; valueA: number; valueB: number }
  | { id: string; type: 'waitTilt'; direction: TiltDirection }
  | { id: string; type: 'waitButton' }
  | { id: string; type: 'repeat'; times: number }
  | { id: string; type: 'forever' }
  | { id: string; type: 'endLoop' };

export interface SimpleStack {
  id: string;
  trigger: SimpleTrigger;
  blocks: SimpleBlock[];
}

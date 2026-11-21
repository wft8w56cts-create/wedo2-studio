import { SimpleStack } from './types';

export interface SimpleExample {
  id: string;
  namePl: string;
  nameEn: string;
  descPl: string;
  descEn: string;
  stacks: SimpleStack[];
}

export const SIMPLE_EXAMPLES: SimpleExample[] = [
  {
    id: 'obstacle-stop',
    namePl: 'Auto-hamowanie (próg 3.0)',
    nameEn: 'Auto-Brake at Distance 3.0',
    descPl: 'Jedzie do przodu, hamuje gdy obiekt znajdzie się poniżej 3.0, świeci na czerwono i cofa.',
    descEn: 'Drives forward, hard-brakes when distance drops below 3.0, turns LED red and reverses.',
    stacks: [
      {
        id: 'stack-1',
        trigger: { type: 'start' },
        blocks: [
          { id: 'b1', type: 'led', hex: '#22c55e' },
          { id: 'b2', type: 'motor', power: 75, port: 'auto' },
          { id: 'b3', type: 'waitDistance', op: '<', valueA: 3.0, valueB: 5.0 },
          { id: 'b4', type: 'stopMotor', brake: true, port: 'auto' },
          { id: 'b5', type: 'led', hex: '#ef4444' },
          { id: 'b6', type: 'melody', melody: 'alarm' },
          { id: 'b7', type: 'motor', power: -60, port: 'auto' },
          { id: 'b8', type: 'wait', seconds: 1.2 },
          { id: 'b9', type: 'stopMotor', brake: true, port: 'auto' },
          { id: 'b10', type: 'led', hex: '#3b82f6' },
        ],
      },
    ],
  },
  {
    id: 'three-zones',
    namePl: '3 strefy odległości (równoległe)',
    nameEn: '3 Distance Zones (Parallel)',
    descPl: 'Trzy równoległe wątki reagują na różne zakresy odległości: daleko (>6), średnio (3–6) i blisko (<3).',
    descEn: 'Three parallel threads react to exact distance bands: far (>6), mid (3–6), and close (<3).',
    stacks: [
      {
        id: 'zone-far',
        trigger: { type: 'distance', op: '>', valueA: 6.0, valueB: 10.0 },
        blocks: [
          { id: 'zf1', type: 'led', hex: '#22c55e' },
          { id: 'zf2', type: 'motor', power: 80, port: 'auto' },
        ],
      },
      {
        id: 'zone-mid',
        trigger: { type: 'distance', op: 'between', valueA: 3.0, valueB: 6.0 },
        blocks: [
          { id: 'zm1', type: 'led', hex: '#eab308' },
          { id: 'zm2', type: 'motor', power: 40, port: 'auto' },
          { id: 'zm3', type: 'tone', freq: 523, durationMs: 180 },
        ],
      },
      {
        id: 'zone-close',
        trigger: { type: 'distance', op: '<', valueA: 3.0, valueB: 10.0 },
        blocks: [
          { id: 'zc1', type: 'stopMotor', brake: true, port: 'auto' },
          { id: 'zc2', type: 'led', hex: '#ef4444' },
          { id: 'zc3', type: 'tone', freq: 988, durationMs: 250 },
        ],
      },
    ],
  },
  {
    id: 'adaptive-cruise',
    namePl: 'Tempomat aktywny (ACC — 4 strefy + przycisk)',
    nameEn: 'Adaptive Cruise Control (ACC — 4 Zones + Button)',
    descPl: 'Utrzymuje zadaną prędkość, płynnie zwalnia w 2 strefach i hamuje awaryjnie poniżej 2.5. Przycisk Hubu zatrzymuje pojazd.',
    descEn: 'Maintains cruise speed, slows down across 2 distance zones, and hard-brakes below 2.5. Hub button stops the vehicle.',
    stacks: [
      {
        id: 'acc-cruise',
        trigger: { type: 'distance', op: '>', valueA: 7.0, valueB: 10.0 },
        blocks: [
          { id: 'ac1', type: 'led', hex: '#22c55e' },
          { id: 'ac2', type: 'motor', power: 85, port: 'auto' },
        ],
      },
      {
        id: 'acc-follow',
        trigger: { type: 'distance', op: 'between', valueA: 4.5, valueB: 7.0 },
        blocks: [
          { id: 'af1', type: 'led', hex: '#eab308' },
          { id: 'af2', type: 'motor', power: 50, port: 'auto' },
        ],
      },
      {
        id: 'acc-slow',
        trigger: { type: 'distance', op: 'between', valueA: 2.5, valueB: 4.5 },
        blocks: [
          { id: 'as1', type: 'led', hex: '#f97316' },
          { id: 'as2', type: 'motor', power: 25, port: 'auto' },
        ],
      },
      {
        id: 'acc-brake',
        trigger: { type: 'distance', op: '<', valueA: 2.5, valueB: 10.0 },
        blocks: [
          { id: 'ab1', type: 'stopMotor', brake: true, port: 'auto' },
          { id: 'ab2', type: 'led', hex: '#ef4444' },
          { id: 'ab3', type: 'tone', freq: 880, durationMs: 160 },
        ],
      },
      {
        id: 'acc-btn',
        trigger: { type: 'button' },
        blocks: [
          { id: 'ax1', type: 'stopMotor', brake: true, port: 'auto' },
          { id: 'ax2', type: 'led', hex: '#3b82f6' },
          { id: 'ax3', type: 'tone', freq: 440, durationMs: 180 },
        ],
      },
    ],
  },
  {
    id: 'tilt-controller',
    namePl: 'Sterownik na przechył + przycisk',
    nameEn: 'Tilt & Hub Button Controller',
    descPl: 'Przechył w prawo/lewo steruje kierunkiem silnika, a przycisk hubu zatrzymuje i gra fanfarę.',
    descEn: 'Tilt right/left controls motor direction; hub button stops and plays a fanfare.',
    stacks: [
      {
        id: 't-right',
        trigger: { type: 'tilt', direction: 'right' },
        blocks: [
          { id: 'tr1', type: 'led', hex: '#06b6d4' },
          { id: 'tr2', type: 'motor', power: 70, port: 'auto' },
        ],
      },
      {
        id: 't-left',
        trigger: { type: 'tilt', direction: 'left' },
        blocks: [
          { id: 'tl1', type: 'led', hex: '#a855f7' },
          { id: 'tl2', type: 'motor', power: -70, port: 'auto' },
        ],
      },
      {
        id: 't-btn',
        trigger: { type: 'button' },
        blocks: [
          { id: 'tb1', type: 'stopMotor', brake: true, port: 'auto' },
          { id: 'tb2', type: 'led', hex: '#f8fafc' },
          { id: 'tb3', type: 'melody', melody: 'startup' },
        ],
      },
    ],
  },
];

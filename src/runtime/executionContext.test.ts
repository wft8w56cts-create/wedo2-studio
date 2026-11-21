import { describe, expect, it } from 'vitest';
import { compareDistance } from './executionContext';

describe('Distance threshold comparison', () => {
  it('evaluates <, <=, >, >=, ==, and between operators accurately', () => {
    expect(compareDistance(2.4, '<', 2.5)).toBe(true);
    expect(compareDistance(2.5, '<', 2.5)).toBe(false);
    expect(compareDistance(2.5, '<=', 2.5)).toBe(true);
    expect(compareDistance(6.1, '>', 6.0)).toBe(true);
    expect(compareDistance(6.0, '>=', 6.0)).toBe(true);
    expect(compareDistance(3.4, '==', 3.5)).toBe(true);
    expect(compareDistance(4.0, '==', 3.5)).toBe(false);
    expect(compareDistance(4.2, 'between', 3.0, 6.0)).toBe(true);
    expect(compareDistance(4.2, 'between', 6.0, 3.0)).toBe(true);
    expect(compareDistance(2.9, 'between', 3.0, 6.0)).toBe(false);
  });
});

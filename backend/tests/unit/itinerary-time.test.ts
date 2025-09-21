

import { describe, test, expect } from 'vitest';
import { overlaps, durationMin } from '../../../src/lib/itinerary-time';
import type { HHMM } from '../../../src/types';

test('overlaps true when intervals clash', () => {
  const a = { start: '10:00' as HHMM, end: '11:00' as HHMM };
  const b = { start: '10:30' as HHMM, end: '11:30' as HHMM };
  expect(overlaps(a, b)).toBe(true);
});

test('overlaps false for adjacent intervals', () => {
  const a = { start: '10:00' as HHMM, end: '11:00' as HHMM };
  const b = { start: '11:00' as HHMM, end: '12:00' as HHMM };
  expect(overlaps(a, b)).toBe(false);
});

test('durationMin returns null if end<start', () => {
  expect(durationMin('12:00' as HHMM, '11:00' as HHMM)).toBeNull();
});

test('durationMin returns correct duration', () => {
  expect(durationMin('10:15' as HHMM, '11:45' as HHMM)).toBe(90);
});

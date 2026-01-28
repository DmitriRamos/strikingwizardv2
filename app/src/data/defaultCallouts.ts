import type { Callout } from '../types/session';

let nextId = 1;
const c = (label: string, enabled = false): Callout => ({
  id: String(nextId++),
  label,
  enabled,
});

/** Single techniques — standard numbered boxing system. */
const singles: Callout[] = [
  c('Jab', true),
  c('Cross', true),
  c('Lead Hook', true),
  c('Rear Hook'),
  c('Lead Uppercut'),
  c('Rear Uppercut'),
  c('Body'),
  c('Slip'),
  c('Roll'),
];

/** Common combination callouts. */
const combos: Callout[] = [
  c('1-2'),
  c('1-1-2'),
  c('1-2-3'),
  c('1-2-3-2'),
  c('1-2-5-2'),
  c('3-2'),
  c('2-3-2'),
  c('1-6-3-2'),
];

export const DEFAULT_CALLOUTS: Callout[] = [...singles, ...combos];

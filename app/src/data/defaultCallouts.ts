import type { Callout } from '../types/session';

let nextId = 1;
const c = (label: string): Callout => ({
  id: String(nextId++),
  label,
  enabled: true,
});

/** Single techniques — standard numbered boxing system. */
const singles: Callout[] = [
  c('Jab'),
  c('Cross'),
  c('Lead Hook'),
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

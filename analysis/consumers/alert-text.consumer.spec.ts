import { describe, expect, it } from 'vitest';

import { alertTextConsumer } from './alert-text.consumer';
import type { AdvancedAlert } from 'engine/types';

const createAlert = (overrides: Partial<AdvancedAlert> = {}): AdvancedAlert => ({
  month: '2024-01',
  domain: 'BUDGET',
  category: 'Alimentation',
  ruleId: 'BUDGET:2024-01',
  groupId: 'BUDGET:Alimentation',
  severity: 'INFO',
  metadata: undefined,
  priorityRank: 10,
  ...overrides,
});

describe('alertTextConsumer', () => {
  it('is deterministic: same input gives same output', () => {
    const baseline = [createAlert({ ruleId: 'BUDGET:1', priorityRank: 5 })];
    const first = alertTextConsumer(baseline);
    const second = alertTextConsumer(baseline);

    expect(first).toEqual(second);
  });

  it('never mutates the input array or its alerts', () => {
    const alerts = [
      createAlert({ ruleId: 'BUDGET:2', priorityRank: 2 }),
      createAlert({ ruleId: 'BUDGET:3', priorityRank: 3 }),
    ];
    const snapshot = JSON.parse(JSON.stringify(alerts));

    alertTextConsumer(alerts);

    expect(alerts).toEqual(snapshot);
  });

  it('orders output strictly by priorityRank', () => {
    const unordered = [
      createAlert({ ruleId: 'LOW', priorityRank: 20 }),
      createAlert({ ruleId: 'HIGH', priorityRank: 5 }),
    ];
    const ordered = alertTextConsumer(unordered);

    expect(ordered.map((entry) => entry.priorityRank)).toEqual([5, 20]);
  });

  it('maps severity to the French tone and keeps severity metadata', () => {
    const warningEntry = alertTextConsumer([
      createAlert({ severity: 'WARNING', priorityRank: 1 }),
    ])[0];

    expect(warningEntry.message).toContain('Ton : attention / seuil approché');
    expect(warningEntry.severity).toBe('WARNING');
  });

  it('retains groupId, priorityRank, and composes a human-readable title', () => {
    const alert = createAlert({
      groupId: 'BUDGET:urgent',
      priorityRank: 7,
      category: 'Loisirs',
    });
    const output = alertTextConsumer([alert])[0];

    expect(output).toMatchObject({
      groupId: 'BUDGET:urgent',
      priorityRank: 7,
      title: 'Budget — Loisirs',
    });
  });

  it('builds messages purely from alert metadata and domain labels', () => {
    const metadataAlert = createAlert({
      metadata: { detail: 'coût critique', amount: 120 },
      priorityRank: 11,
    });
    const entry = alertTextConsumer([metadataAlert])[0];

    expect(entry.message).toContain('Données : detail : coût critique · amount : 120');
    expect(entry.message).toContain('Domaine : Budget');
    expect(entry.message).toContain('Règle : BUDGET:2024-01');
  });
});

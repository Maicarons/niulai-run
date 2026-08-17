import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadProgress,
  saveProgress,
  nextLevelId,
  recordClear,
  LEVEL_IDS,
  PROGRESS_KEY,
} from '../progress';
import type { Progress } from '../../types/game';

/** Minimal Map-backed localStorage mock (no jsdom needed). */
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: unknown }).localStorage = new MemoryStorage();
});

describe('recordClear', () => {
  it('keeps the highest star rating (Math.max)', () => {
    const before: Progress = { unlocked: 1, stars: { L1: 2 } };
    const after = recordClear(before, 'L1', 1);
    expect(after.stars.L1).toBe(2);
    // does not mutate the input
    expect(before.stars.L1).toBe(2);
  });

  it('upgrades the star rating when new is higher', () => {
    const after = recordClear({ unlocked: 1, stars: { L1: 1 } }, 'L1', 3);
    expect(after.stars.L1).toBe(3);
  });

  it('unlocks the next level (idx + 2)', () => {
    const after = recordClear({ unlocked: 1, stars: {} }, 'L1', 1);
    expect(after.unlocked).toBe(2);
    const afterL3 = recordClear({ unlocked: 1, stars: {} }, 'L3', 1);
    expect(afterL3.unlocked).toBe(4);
  });

  it('returns a new object (pure)', () => {
    const before: Progress = { unlocked: 1, stars: {} };
    const after = recordClear(before, 'L1', 3);
    expect(after).not.toBe(before);
  });

  it('ignores unknown level id for unlock but keeps stars', () => {
    const after = recordClear({ unlocked: 1, stars: {} }, 'ZZ', 3);
    expect(after.unlocked).toBe(1);
    expect(after.stars.ZZ).toBe(3);
  });
});

describe('nextLevelId', () => {
  it('advances to the next level id', () => {
    expect(nextLevelId('L1')).toBe('L2');
    expect(nextLevelId('L4')).toBe('L5');
  });

  it('returns null after the last level (L5)', () => {
    expect(nextLevelId('L5')).toBeNull();
  });

  it('returns null for an unknown level id', () => {
    expect(nextLevelId('L99')).toBeNull();
    expect(nextLevelId('')).toBeNull();
  });
});

describe('saveProgress / loadProgress', () => {
  it('round-trips progress through mock localStorage', () => {
    const data: Progress = { unlocked: 3, stars: { L1: 2, L2: 3 } };
    saveProgress(data);
    const raw = (globalThis as unknown as { localStorage: MemoryStorage }).localStorage.getItem(PROGRESS_KEY);
    expect(raw).not.toBeNull();
    expect(loadProgress()).toEqual(data);
  });

  it('returns default progress when nothing is stored', () => {
    expect(loadProgress()).toEqual({ unlocked: 1, stars: {} });
  });

  it('falls back to default on corrupt JSON', () => {
    (globalThis as unknown as { localStorage: MemoryStorage }).localStorage.setItem(PROGRESS_KEY, '{not valid json');
    expect(loadProgress()).toEqual({ unlocked: 1, stars: {} });
  });

  it('fills missing stars with an empty object', () => {
    (globalThis as unknown as { localStorage: MemoryStorage }).localStorage.setItem(PROGRESS_KEY, JSON.stringify({ unlocked: 3 }));
    expect(loadProgress()).toEqual({ unlocked: 3, stars: {} });
  });

  it('ignores a non-number unlocked field', () => {
    (globalThis as unknown as { localStorage: MemoryStorage }).localStorage.setItem(PROGRESS_KEY, JSON.stringify({ unlocked: 'oops' }));
    expect(loadProgress()).toEqual({ unlocked: 1, stars: {} });
  });
});

describe('LEVEL_IDS', () => {
  it('contains the 5 expected level ids in order', () => {
    expect(LEVEL_IDS).toEqual(['L1', 'L2', 'L3', 'L4', 'L5']);
  });
});

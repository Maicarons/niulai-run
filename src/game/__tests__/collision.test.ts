import { describe, it, expect } from 'vitest';
import { aabb, collectCoins } from '../collision';
import type { Coin, Rect } from '../../types/game';

describe('aabb', () => {
  it('intersecting rectangles overlap -> true', () => {
    const a: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const b: Rect = { x: 5, y: 5, w: 10, h: 10 };
    expect(aabb(a, b)).toBe(true);
  });

  it('disjoint rectangles -> false', () => {
    const a: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const b: Rect = { x: 20, y: 20, w: 10, h: 10 };
    expect(aabb(a, b)).toBe(false);
  });

  it('edge-adjacent rectangles (touching) -> false', () => {
    const a: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const b: Rect = { x: 10, y: 0, w: 10, h: 10 };
    expect(aabb(a, b)).toBe(false);
  });

  it('containment -> true', () => {
    const outer: Rect = { x: 0, y: 0, w: 20, h: 20 };
    const inner: Rect = { x: 5, y: 5, w: 5, h: 5 };
    expect(aabb(outer, inner)).toBe(true);
    expect(aabb(inner, outer)).toBe(true);
  });
});

describe('collectCoins', () => {
  const makeCoin = (x: number, y: number, collected?: boolean): Coin => ({ x, y, collected });

  it('eats a coin whose box overlaps the player -> returns 1', () => {
    const player: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const coins = [makeCoin(5, 5)];
    const gained = collectCoins(player, coins);
    expect(gained).toBe(1);
    expect(coins[0].collected).toBe(true);
  });

  it('does not eat a distant coin -> returns 0', () => {
    const player: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const coins = [makeCoin(100, 100)];
    const gained = collectCoins(player, coins);
    expect(gained).toBe(0);
    expect(coins[0].collected).toBeUndefined();
  });

  it('partial overlap still counts as eaten -> returns 1', () => {
    const player: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const coins = [makeCoin(8, 5)]; // box extends into player corner
    const gained = collectCoins(player, coins);
    expect(gained).toBe(1);
    expect(coins[0].collected).toBe(true);
  });

  it('is idempotent: already-collected coins are not recounted', () => {
    const player: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const coins = [makeCoin(5, 5, true)];
    const gained = collectCoins(player, coins);
    expect(gained).toBe(0);
    expect(coins[0].collected).toBe(true);
  });

  it('counts multiple coins eaten in a single call', () => {
    const player: Rect = { x: 0, y: 0, w: 60, h: 60 };
    const coins = [makeCoin(5, 5), makeCoin(40, 40), makeCoin(200, 200)];
    const gained = collectCoins(player, coins);
    expect(gained).toBe(2);
    expect(coins[0].collected).toBe(true);
    expect(coins[1].collected).toBe(true);
    expect(coins[2].collected).toBeUndefined();
  });

  it('repeated calls do not double-count', () => {
    const player: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const coins = [makeCoin(5, 5)];
    expect(collectCoins(player, coins)).toBe(1);
    expect(collectCoins(player, coins)).toBe(0);
  });
});

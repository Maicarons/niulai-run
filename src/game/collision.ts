/**
 * 纯碰撞逻辑（不依赖 PixiJS / DOM，便于单元测试）。
 * 从 runner.ts 抽取，行为与原内联实现严格一致。
 */

import type { Coin, Rect } from '../types/game';

/** 金币判定盒半边长（与 runner.ts 中的 9px 一致） */
const COIN_HALF = 9;

/** AABB 相交检测：仅当两矩形内部存在重叠时返回 true（边相邻不算相交） */
export function aabb(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * 金币拾取：用身体矩形与每枚金币的 AABB 矩形做重叠检测，碰到即吃。
 *
 * - 已吃过的金币（coin.collected === true）跳过，不再计数；
 * - 命中则把 coin.collected 置为 true（副作用，便于 runner 侧隐藏精灵）；
 * - 返回本帧「新吃到」的金币数（已吃的不再计数，调用幂等）。
 */
export function collectCoins(playerRect: Rect, coins: ReadonlyArray<Coin>): number {
  let gained = 0;
  for (const coin of coins) {
    if (coin.collected) continue;
    const coinRect: Rect = {
      x: coin.x - COIN_HALF,
      y: coin.y - COIN_HALF,
      w: COIN_HALF * 2,
      h: COIN_HALF * 2,
    };
    if (aabb(playerRect, coinRect)) {
      coin.collected = true;
      gained += 1;
    }
  }
  return gained;
}

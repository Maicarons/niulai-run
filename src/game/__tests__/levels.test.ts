import { describe, it, expect } from 'vitest';
import { getLevel } from '../levels';
import { LEVEL_IDS, LEVEL_COUNT } from '../progress';

describe('getLevel', () => {
  it('returns a structurally valid LevelData for every level id', () => {
    for (const id of LEVEL_IDS) {
      const level = getLevel(id);
      expect(level).toBeDefined();
      expect(typeof level.id).toBe('string');
      expect(typeof level.name).toBe('string');

      // 关卡总宽度必须为正数
      expect(typeof level.width).toBe('number');
      expect(level.width).toBeGreaterThan(0);

      // 地面 / 障碍 / 金币 必须为数组
      expect(Array.isArray(level.ground)).toBe(true);
      expect(Array.isArray(level.obstacles)).toBe(true);
      expect(Array.isArray(level.coins)).toBe(true);

      // 终点旗坐标必须存在且为有限数
      expect(typeof level.finishX).toBe('number');
      expect(Number.isFinite(level.finishX)).toBe(true);
      expect(level.finishX).toBeGreaterThan(0);

      // 每个障碍都有合法类型
      for (const ob of level.obstacles) {
        expect(ob.kind === 'spike' || ob.kind === 'hang').toBe(true);
        expect(typeof ob.x).toBe('number');
        expect(typeof ob.y).toBe('number');
      }

      // 每枚金币都有坐标
      for (const coin of level.coins) {
        expect(typeof coin.x).toBe('number');
        expect(typeof coin.y).toBe('number');
      }

      // 金币总数与数组长度一致
      expect(level.totalCoins).toBe(level.coins.length);
    }
  });

  it('provides a playable L1 layout (8 coins, finish before world end)', () => {
    const l1 = getLevel('L1');
    expect(l1.totalCoins).toBe(8);
    expect(l1.finishX).toBeLessThan(l1.width);
  });

  it('level count matches the number of level ids', () => {
    expect(LEVEL_COUNT).toBe(LEVEL_IDS.length);
  });
});

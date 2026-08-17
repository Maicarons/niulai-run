/**
 * 关卡静态数据（硬编码 L1，垂直切片）。
 *
 * 数值为占位，后续用 design-strategist 的 level-1-spec 校准。
 * 坐标均为「世界坐标」，地面段顶部统一对齐 GROUND_TOP（见 constants.ts）。
 * 地面段之间留出的缺口即深坑 O3；障碍分为 O1 地刺（地面）与 O2 低悬（占位为可跳越方块）。
 */

import { GROUND_TOP, SPRITE_PATHS } from './constants';
import type { LevelData } from '../types/game';

/**
 * L1：长度 3200，含 1 处深坑、2 组地刺、1 组低悬、8 枚金币、终点旗。
 * 布局保证可跳越（跳跃水平距离 ≈197px > 深坑 160px，跳跃高度 ≈144px > 障碍 70px）。
 */
const LEVEL_1: LevelData = {
  id: 'L1',
  name: '初遇草地',
  width: 3200,
  ground: [
    { x: 0, y: GROUND_TOP, w: 1200, h: 320 },
    { x: 1360, y: GROUND_TOP, w: 1840, h: 320 },
  ],
  obstacles: [
    { kind: 'spike', x: 760, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 2050, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'hang', x: 2650, y: GROUND_TOP - 70, w: 46, h: 70 },
  ],
  coins: [
    { x: 420, y: GROUND_TOP - 60 },
    { x: 560, y: GROUND_TOP - 60 },
    { x: 1000, y: GROUND_TOP - 50 },
    { x: 1280, y: GROUND_TOP - 90 }, // 深坑上方，鼓励起跳
    { x: 1450, y: GROUND_TOP - 90 }, // 落地一侧
    { x: 1900, y: GROUND_TOP - 50 },
    { x: 2400, y: GROUND_TOP - 50 },
    { x: 2900, y: GROUND_TOP - 60 },
  ],
  finishX: 3000,
  totalCoins: 8,
};

/**
 * 取关卡数据。
 * 垂直切片仅 L1 为真实设计；其余关卡返回 L1（UI 侧按解锁状态拦截选择）。
 * 后续接入多关卡时改为查表。
 */
export function getLevel(levelId: string): LevelData {
  if (levelId === 'L1') return LEVEL_1;
  // 占位：其余关卡暂复用 L1 数据
  return LEVEL_1;
}

/** 精灵资源路径导出（供 loader 使用） */
export const SPRITE_URL = SPRITE_PATHS.niulai;

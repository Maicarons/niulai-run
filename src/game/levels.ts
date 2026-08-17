/**
 * 关卡静态数据（5 关全部为真实设计，难度递增）。
 *
 * 坐标均为「世界坐标」，地面段顶部统一对齐 GROUND_TOP（见 constants.ts）。
 * 地面段之间留出的缺口即深坑 O3；障碍分为 O1 地刺（地面）与 O2 低悬（可跳越方块）。
 *
 * 物理约束（见 constants.ts，由 runner.ts 实现）：
 *  - 跳跃滞空 ≈0.76s、水平射程 ≈197px → 深坑缺口统一 ≤170px 留余量。
 *  - 跳跃顶点高 ≈144px → 地刺(42) / 低悬(70) 均可越。
 *  - 障碍距坑沿 ≥220px：保证「越障落地」后有足够地面再起跳过坑，避免落地即坠坑。
 */

import { GROUND_TOP, SPRITE_PATHS } from './constants';
import type { LevelData } from '../types/game';

/**
 * L1：初遇草地。长度 3200，含 1 处深坑、2 组地刺、1 组低悬、8 枚金币、终点旗。
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
 * L2：管道农庄。长度 3600，2 处深坑、4 组障碍（含 1 对地刺）、9 枚金币。
 * 较 L1 增加坑数与障碍密度，仍为新手友好节奏。
 */
const LEVEL_2: LevelData = {
  id: 'L2',
  name: '管道农庄',
  width: 3600,
  ground: [
    { x: 0, y: GROUND_TOP, w: 1250, h: 320 },
    { x: 1400, y: GROUND_TOP, w: 900, h: 320 },
    { x: 2460, y: GROUND_TOP, w: 1140, h: 320 },
  ],
  obstacles: [
    { kind: 'spike', x: 500, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 560, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'hang', x: 900, y: GROUND_TOP - 70, w: 46, h: 70 },
    { kind: 'hang', x: 1700, y: GROUND_TOP - 70, w: 46, h: 70 },
    { kind: 'spike', x: 1900, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 1960, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'hang', x: 2900, y: GROUND_TOP - 70, w: 46, h: 70 },
    { kind: 'spike', x: 3150, y: GROUND_TOP - 42, w: 42, h: 42 },
  ],
  coins: [
    { x: 420, y: GROUND_TOP - 60 },
    { x: 530, y: GROUND_TOP - 90 }, // 地刺对上方
    { x: 950, y: GROUND_TOP - 60 },
    { x: 1325, y: GROUND_TOP - 100 }, // 深坑上方（1250→1400）
    { x: 1650, y: GROUND_TOP - 50 },
    { x: 1930, y: GROUND_TOP - 90 }, // 地刺对上方
    { x: 2380, y: GROUND_TOP - 100 }, // 深坑上方（2300→2460）
    { x: 2950, y: GROUND_TOP - 50 },
    { x: 3200, y: GROUND_TOP - 60 },
  ],
  finishX: 3450,
  totalCoins: 9,
};

/**
 * L3：箱庭窄道。长度 4000，3 处深坑、9 组障碍（含 2 对地刺）、10 枚金币。
 * 障碍更密，开始出现连续跳越需求。
 */
const LEVEL_3: LevelData = {
  id: 'L3',
  name: '箱庭窄道',
  width: 4000,
  ground: [
    { x: 0, y: GROUND_TOP, w: 1000, h: 320 },
    { x: 1160, y: GROUND_TOP, w: 1040, h: 320 },
    { x: 2350, y: GROUND_TOP, w: 850, h: 320 },
    { x: 3360, y: GROUND_TOP, w: 640, h: 320 },
  ],
  obstacles: [
    { kind: 'spike', x: 400, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'hang', x: 650, y: GROUND_TOP - 70, w: 46, h: 70 },
    { kind: 'spike', x: 1450, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 1510, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'hang', x: 1750, y: GROUND_TOP - 70, w: 46, h: 70 },
    { kind: 'hang', x: 2650, y: GROUND_TOP - 70, w: 46, h: 70 },
    { kind: 'spike', x: 2850, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 3650, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'hang', x: 3750, y: GROUND_TOP - 70, w: 46, h: 70 },
  ],
  coins: [
    { x: 300, y: GROUND_TOP - 60 },
    { x: 420, y: GROUND_TOP - 90 }, // 地刺上方
    { x: 680, y: GROUND_TOP - 90 }, // 低悬上方
    { x: 1080, y: GROUND_TOP - 100 }, // 深坑上方（1000→1160）
    { x: 1480, y: GROUND_TOP - 90 }, // 地刺对上方
    { x: 1850, y: GROUND_TOP - 50 },
    { x: 2275, y: GROUND_TOP - 100 }, // 深坑上方（2200→2350）
    { x: 2700, y: GROUND_TOP - 50 }, // 低悬旁
    { x: 3280, y: GROUND_TOP - 100 }, // 深坑上方（3200→3360）
    { x: 3700, y: GROUND_TOP - 90 }, // 地刺上方
  ],
  finishX: 3850,
  totalCoins: 10,
};

/**
 * L4：风车作坊。长度 4500，4 处深坑、10 组障碍（含 3 对地刺）、11 枚金币。
 * 障碍密度进一步提高，落地—起跳节奏更紧凑。
 */
const LEVEL_4: LevelData = {
  id: 'L4',
  name: '风车作坊',
  width: 4500,
  ground: [
    { x: 0, y: GROUND_TOP, w: 950, h: 320 },
    { x: 1110, y: GROUND_TOP, w: 940, h: 320 },
    { x: 2200, y: GROUND_TOP, w: 850, h: 320 },
    { x: 3210, y: GROUND_TOP, w: 1290, h: 320 },
  ],
  obstacles: [
    { kind: 'spike', x: 400, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 460, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'hang', x: 650, y: GROUND_TOP - 70, w: 46, h: 70 },
    { kind: 'hang', x: 1400, y: GROUND_TOP - 70, w: 46, h: 70 },
    { kind: 'spike', x: 1600, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 1660, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 2500, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'hang', x: 2700, y: GROUND_TOP - 70, w: 46, h: 70 },
    { kind: 'spike', x: 3500, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 3560, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'hang', x: 3800, y: GROUND_TOP - 70, w: 46, h: 70 },
    { kind: 'spike', x: 4000, y: GROUND_TOP - 42, w: 42, h: 42 },
  ],
  coins: [
    { x: 300, y: GROUND_TOP - 60 },
    { x: 430, y: GROUND_TOP - 90 }, // 地刺对上方
    { x: 700, y: GROUND_TOP - 90 }, // 低悬上方
    { x: 1030, y: GROUND_TOP - 100 }, // 深坑上方（950→1110）
    { x: 1450, y: GROUND_TOP - 50 },
    { x: 1630, y: GROUND_TOP - 90 }, // 地刺对上方
    { x: 2125, y: GROUND_TOP - 100 }, // 深坑上方（2050→2200）
    { x: 2600, y: GROUND_TOP - 90 }, // 地刺上方
    { x: 3125, y: GROUND_TOP - 100 }, // 深坑上方（3050→3210）
    { x: 3530, y: GROUND_TOP - 90 }, // 地刺对上方
    { x: 4050, y: GROUND_TOP - 50 },
  ],
  finishX: 4250,
  totalCoins: 11,
};

/**
 * L5：牛来大道。长度 4800，5 处深坑、11 组障碍（含 4 对地刺）、12 枚金币。
 * 最终关，坑数/障碍密度最高，考验连续跳越与节奏控制。
 */
const LEVEL_5: LevelData = {
  id: 'L5',
  name: '牛来大道',
  width: 4800,
  ground: [
    { x: 0, y: GROUND_TOP, w: 820, h: 320 },
    { x: 980, y: GROUND_TOP, w: 1000, h: 320 },
    { x: 2140, y: GROUND_TOP, w: 900, h: 320 },
    { x: 3200, y: GROUND_TOP, w: 840, h: 320 },
    { x: 4200, y: GROUND_TOP, w: 600, h: 320 },
  ],
  obstacles: [
    { kind: 'spike', x: 350, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 410, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'hang', x: 1300, y: GROUND_TOP - 70, w: 46, h: 70 },
    { kind: 'spike', x: 1520, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 1580, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 2400, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 2460, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'hang', x: 2700, y: GROUND_TOP - 70, w: 46, h: 70 },
    { kind: 'spike', x: 3500, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 3560, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'hang', x: 3750, y: GROUND_TOP - 70, w: 46, h: 70 },
    { kind: 'spike', x: 4400, y: GROUND_TOP - 42, w: 42, h: 42 },
    { kind: 'spike', x: 4460, y: GROUND_TOP - 42, w: 42, h: 42 },
  ],
  coins: [
    { x: 300, y: GROUND_TOP - 60 },
    { x: 380, y: GROUND_TOP - 90 }, // 地刺对上方
    { x: 900, y: GROUND_TOP - 100 }, // 深坑上方（820→980）
    { x: 1330, y: GROUND_TOP - 90 }, // 低悬上方
    { x: 1550, y: GROUND_TOP - 90 }, // 地刺对上方
    { x: 2060, y: GROUND_TOP - 100 }, // 深坑上方（1980→2140）
    { x: 2430, y: GROUND_TOP - 90 }, // 地刺对上方
    { x: 2750, y: GROUND_TOP - 50 }, // 低悬旁
    { x: 3120, y: GROUND_TOP - 100 }, // 深坑上方（3040→3200）
    { x: 3530, y: GROUND_TOP - 90 }, // 地刺对上方
    { x: 3770, y: GROUND_TOP - 50 }, // 低悬旁
    { x: 4120, y: GROUND_TOP - 100 }, // 深坑上方（4040→4200）
  ],
  finishX: 4650,
  totalCoins: 12,
};

/** 关卡查表（id → 数据） */
const LEVEL_TABLE: Record<string, LevelData> = {
  L1: LEVEL_1,
  L2: LEVEL_2,
  L3: LEVEL_3,
  L4: LEVEL_4,
  L5: LEVEL_5,
};

/**
 * 取关卡数据。未知 id 回退到 L1（避免 undefined 崩溃）。
 */
export function getLevel(levelId: string): LevelData {
  return LEVEL_TABLE[levelId] ?? LEVEL_1;
}

/** 精灵资源路径导出（供 loader 使用） */
export const SPRITE_URL = SPRITE_PATHS.niulai;

/**
 * 核心游戏类型定义（预制作垂直切片）。
 */

/** 二维向量 */
export interface Vec2 {
  x: number;
  y: number;
}

/** 轴对齐矩形（世界坐标） */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 障碍类型：O1 地刺 / O2 低悬 */
export type ObstacleKind = 'spike' | 'hang';

/** 障碍定义 */
export interface Obstacle extends Rect {
  kind: ObstacleKind;
}

/** 金币 */
export interface Coin {
  x: number;
  y: number;
  collected?: boolean;
}

/** 关卡静态数据 */
export interface LevelData {
  id: string;
  name: string;
  /** 世界总宽度（像素） */
  width: number;
  /** 地面段（顶部统一为 GROUND_TOP，缺口即深坑 O3） */
  ground: Rect[];
  /** 障碍：O1 地刺 / O2 低悬 */
  obstacles: Obstacle[];
  /** 金币 */
  coins: Coin[];
  /** 终点旗 x 坐标 */
  finishX: number;
  /** 金币总数（= coins.length） */
  totalCoins: number;
}

/** 角色动画状态（行映射见 spritesheet.ts） */
export type AnimName =
  | 'idle' | 'run' | 'jump' | 'fall' | 'hurt' | 'win' | 'slide' | 'dash';

/** 顶层屏幕状态机（React 侧持有，符合 ADR-003） */
export type Screen = 'mainMenu' | 'levelSelect' | 'playing' | 'pause' | 'result';

/** HUD 快照（游戏 → UI，节流推送，≤10Hz） */
export interface HudSnapshot {
  lives: number;
  coins: number;
  mistakes: number;
  /** 角色世界 x（距离） */
  distance: number;
  /** 关卡进度 0..1 */
  progress: number;
}

/** 进度持久化结构（localStorage，key: niulai.progress） */
export interface Progress {
  /** 已解锁关卡数量（1 表示仅 L1） */
  unlocked: number;
  /** 各关星级 0..3 */
  stars: Record<string, number>;
}

/** 结算结果 */
export interface RunResult {
  cleared: boolean;
  stars: number;
  levelId: string;
}

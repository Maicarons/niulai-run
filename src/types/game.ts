/**
 * 核心游戏类型定义。
 * 当前为技术骨架，仅声明后续玩法 / 状态管理将使用的核心数据结构，
 * 完整实现将在后续 Phase 中由 gameplay 模块填充。
 */

/** 二维向量 */
export interface Vec2 {
  x: number;
  y: number;
}

/** 角色（牛来）运行时状态 */
export interface CharacterState {
  /** 世界坐标位置（左上角为原点） */
  position: Vec2;
  /** 速度（像素 / 帧，逻辑帧） */
  velocity: Vec2;
  /** 是否站在地面上 */
  onGround: boolean;
  /** 当前动画状态（占位，待动画系统接入） */
  animation: 'idle' | 'run' | 'jump';
}

/** 关卡静态数据（占位结构，待 GDD 具体化） */
export interface LevelData {
  id: string;
  name: string;
  /** 平台 / 地面段定义 */
  platforms: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  /** 障碍 / 收集物等（占位） */
  obstacles: unknown[];
}

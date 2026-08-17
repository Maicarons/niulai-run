/**
 * 游戏全局常量（数据驱动配置）。
 * 后续可迁移到关卡数据 / 配置文件中，由 design-strategist 提供的 GDD 驱动。
 */

/** 逻辑分辨率（设计基准尺寸，渲染时按 devicePixelRatio 缩放） */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** 地面高度（像素） */
export const GROUND_HEIGHT = 96;

/** 调色板（十六进制颜色值，供 PixiJS 使用） */
export const COLORS = {
  background: 0x1a1a2e,
  ground: 0x4a4e69,
  character: 0xf2a65a,
} as const;

/**
 * 资源加载路径。
 * 精灵图由 art-director 复制到 public/assets/sprites/niulai.png 后，
 * 通过 utils/assets.ts 的 loadNiulaiSprite() 自动加载并替换占位图形。
 */
export const SPRITE_PATHS = {
  niulai: '/assets/sprites/niulai.png',
} as const;

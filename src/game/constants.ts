/**
 * 游戏全局常量（数据驱动配置）。
 * 数值多为占位，后续用 design-strategist 的 level-1-spec 校准。
 */

/** 逻辑分辨率（设计基准尺寸，渲染时按 devicePixelRatio 缩放） */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/**
 * 精灵概念盒尺寸（用于碰撞盒 / 显示基准，非切片网格）。
 * 真实切片改用方案 B 逐行动态检测（见 game/spritesheet.ts），
 * 各行动画条统一高 38px、含于 42 单元内。
 */
export const FRAME_W = 21;
export const FRAME_H = 42;
/** 整数缩放（参考 art-bible 第 4 节，建议 ×3） */
export const SPRITE_SCALE = 3;

/** 生命值（扣血制，MAX_HP=3） */
export const MAX_HP = 3;

/** 地面顶部 y（世界坐标）；地面段顶部统一在此 */
export const GROUND_TOP = 430;

/** 物理（占位数值，后续校准） */
export const RUN_SPEED = 260;        // px/s，自动向右奔跑
export const GRAVITY = 2000;         // px/s^2
export const JUMP_VELOCITY = -760;   // px/s（向上为负）
export const CAMERA_OFFSET = 320;    // 角色相对画布左侧的基准偏移
export const FALL_Y = GAME_HEIGHT + 120; // 低于此 y 视为坠坑 O3
export const INVULN_TIME = 1.0;      // 受伤后无敌时间（秒）

/** HUD 节流间隔（10Hz） */
export const HUD_INTERVAL = 0.1;

/** 调色板（十六进制，供 PixiJS 使用） */
export const COLORS = {
  background: 0x1a1a2e,
  ground: 0x4a4e69,
  groundTop: 0x6b7089,
  spike: 0xd1495b,
  hang: 0x9b5de5,
  coin: 0xf2c14e,
  finish: 0x57cc99,
  player: 0xf2a65a,
} as const;

/**
 * 资源加载路径。
 * 精灵图由 art-director 复制到 public/assets/sprites/niulai.png，
 * 通过 game/spritesheet.ts 切片加载。
 */
export const SPRITE_PATHS = {
  niulai: '/assets/sprites/niulai.png',
} as const;

/**
 * Kenney 场景与 UI 素材路径（已按项目调色板 recolor，见 public/assets/kenney/CREDITS.txt）。
 */
export const KENNEY_PATHS = {
  groundTop: '/assets/kenney/ground_top.png',
  groundFill: '/assets/kenney/ground_fill.png',
  spike: '/assets/kenney/spike.png',
  crate: '/assets/kenney/crate.png',
  coin: '/assets/kenney/coin.png',
  finishFlag: '/assets/kenney/finish_flag.png',
  bgCloud0: '/assets/kenney/bg_cloud_0.png',
  bgCloud1: '/assets/kenney/bg_cloud_1.png',
  bgCloud2: '/assets/kenney/bg_cloud_2.png',
  bgCloud3: '/assets/kenney/bg_cloud_3.png',
  bgHill0: '/assets/kenney/bg_hill_0.png',
  bgHill1: '/assets/kenney/bg_hill_1.png',
  bgHill2: '/assets/kenney/bg_hill_2.png',
  bgHill3: '/assets/kenney/bg_hill_3.png',
  heartFull: '/assets/kenney/heart_full.png',
  heartEmpty: '/assets/kenney/heart_empty.png',
  btnRect: '/assets/kenney/btn_rect.png',
  btnSquare: '/assets/kenney/btn_square.png',
  btnRound: '/assets/kenney/btn_round.png',
  bgCloudStrip: '/assets/kenney/bg_cloud_strip.png',
  bgHillStrip: '/assets/kenney/bg_hill_strip.png',
} as const;

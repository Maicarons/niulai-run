/**
 * 游戏运行时控制器（GameRunner）。
 *
 * 职责（符合架构文档 ADR-003：游戏运行时状态留在 PixiJS 侧，React 只持屏幕状态机）：
 *  - 加载切片、构建关卡场景（地面 / 障碍 / 金币 / 终点旗 / 角色）
 *  - 固定逻辑的物理步进（自动右跑 + 重力 + 跳跃 + 地面/深坑碰撞）
 *  - 障碍与金币的 AABB 检测、扣血制（MAX_HP=3）、无敌窗口
 *  - 摄像机跟随、动画状态切换（idle/run/jump/fall/hurt/win）
 *  - 以 ≤10Hz 向 React 推送 HudSnapshot，并在通关/失败时通过回调上报
 *
 * 注意：本类不持有任何 React 状态；仅通过构造时传入的回调与外界通信。
 */

import { AnimatedSprite, Application, Assets, Container, Sprite, Texture, Ticker, TilingSprite } from 'pixi.js';
import {
  CAMERA_OFFSET,
  FALL_Y,
  FRAME_H,
  FRAME_W,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRAVITY,
  GROUND_TOP,
  HUD_INTERVAL,
  INVULN_TIME,
  JUMP_VELOCITY,
  KENNEY_PATHS,
  MAX_HP,
  RUN_SPEED,
  SPRITE_SCALE,
} from './constants';
import { getLevel } from './levels';
import { buildFrameMap, type FrameMap } from './spritesheet';
import type { AnimName, Coin, HudSnapshot, LevelData, Rect, RunResult } from '../types/game';

/** 角色出生 x（世界坐标） */
const START_X = 120;

/** 受伤后强制播放 hurt 动画的时长（秒） */
const HURT_ANIM_TIME = 0.4;

/** 物理步进单帧最大时长（秒），防止卡顿后大跳 */
const MAX_STEP = 0.05;

/** 角色受击盒内缩（更宽容的判定） */
const HURT_INSET_X = 14;
const HURT_INSET_Y = 10;

/** 引擎 → UI 的回调集合 */
export interface RunnerCallbacks {
  onHud: (snapshot: HudSnapshot) => void;
  onLevelClear: (result: RunResult) => void;
  onLevelFail: (result: RunResult) => void;
}

/** AABB 相交检测 */
function aabb(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export class GameRunner {
  private app: Application;
  private level: LevelData;
  private callbacks: RunnerCallbacks;

  private world!: Container;
  private bg!: Container;
  private bgCloud!: TilingSprite;
  private bgHill!: TilingSprite;
  private player!: AnimatedSprite;
  private frameMap!: FrameMap;
  private coinGfx = new Map<Coin, Sprite>();
  private coinTime = 0;

  private velocityY = 0;
  private hp = MAX_HP;
  private coinsCollected = 0;
  private mistakes = 0;
  private invuln = 0;
  private hurtTimer = 0;
  private hudTimer = 0;
  private lastSafeX = START_X;

  private finished = false;
  private failed = false;
  private running = false;
  private currentAnim: AnimName = 'idle';

  private tick = (ticker: Ticker) => this.update(ticker.deltaMS);

  constructor(app: Application, levelId: string, callbacks: RunnerCallbacks) {
    this.app = app;
    this.level = getLevel(levelId);
    this.callbacks = callbacks;
  }

  /** 加载资源并构建场景；完成后由 start() 启动 */
  async load(): Promise<void> {
    this.frameMap = await buildFrameMap();
    await Assets.load(Object.values(KENNEY_PATHS));
    this.buildScene();
    this.buildPlayer();
    this.app.ticker.add(this.tick);
    window.addEventListener('keydown', this.onKeyDown);
    this.app.canvas.addEventListener('pointerdown', this.onPointerDown);
  }

  /** 开始运行（解除暂停、开始自动奔跑） */
  start(): void {
    this.running = true;
    this.pushHud();
  }

  /** 暂停 / 恢复（UI 侧由 PauseOverlay 驱动） */
  setPaused(paused: boolean): void {
    this.running = !paused;
  }

  /** 释放：移除 ticker 与监听；Application 由上层销毁 */
  destroy(): void {
    this.app.ticker.remove(this.tick);
    window.removeEventListener('keydown', this.onKeyDown);
    this.app.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.coinGfx.clear();
  }

  // ---------------------------------------------------------------- 场景构建

  private buildScene(): void {
    // 视差背景（屏幕空间，在 world 之前渲染）
    this.bg = new Container();
    this.app.stage.addChild(this.bg);

    const bgW = this.level.width + GAME_WIDTH;
    this.bgCloud = new TilingSprite({ texture: Texture.from(KENNEY_PATHS.bgCloudStrip), width: bgW, height: 72 });
    this.bgCloud.tileScale.set(3);
    this.bgCloud.y = 40;
    this.bg.addChild(this.bgCloud);

    this.bgHill = new TilingSprite({ texture: Texture.from(KENNEY_PATHS.bgHillStrip), width: bgW, height: 72 });
    this.bgHill.tileScale.set(3);
    this.bgHill.y = 170;
    this.bg.addChild(this.bgHill);

    this.world = new Container();
    this.app.stage.addChild(this.world);

    const topTex = Texture.from(KENNEY_PATHS.groundTop);
    const fillTex = Texture.from(KENNEY_PATHS.groundFill);

    // 地面段（缺口即深坑 O3）：顶部草地 + 下方泥土填充
    for (const seg of this.level.ground) {
      const top = new TilingSprite({ texture: topTex, width: seg.w, height: 18 });
      top.x = seg.x;
      top.y = GROUND_TOP - 18;
      this.world.addChild(top);

      const fill = new TilingSprite({ texture: fillTex, width: seg.w, height: GAME_HEIGHT - GROUND_TOP + 200 });
      fill.x = seg.x;
      fill.y = GROUND_TOP;
      this.world.addChild(fill);
    }

    // 障碍：O1 地刺 / O2 低悬木箱
    const spikeTex = Texture.from(KENNEY_PATHS.spike);
    const crateTex = Texture.from(KENNEY_PATHS.crate);
    for (const ob of this.level.obstacles) {
      if (ob.kind === 'spike') {
        const s = new Sprite(spikeTex);
        s.anchor.set(0.5, 1);
        s.x = ob.x + ob.w / 2;
        s.y = ob.y + ob.h;
        const scale = ob.h / 18;
        s.scale.set(scale);
        this.world.addChild(s);
      } else {
        const s = new Sprite(crateTex);
        s.anchor.set(0.5, 1);
        s.x = ob.x + ob.w / 2;
        s.y = ob.y + ob.h;
        const scale = ob.h / 18;
        s.scale.set(scale);
        this.world.addChild(s);
      }
    }

    // 金币
    const coinTex = Texture.from(KENNEY_PATHS.coin);
    for (const coin of this.level.coins) {
      const s = new Sprite(coinTex);
      s.anchor.set(0.5, 0.5);
      s.x = coin.x;
      s.y = coin.y;
      s.scale.set(2);
      this.world.addChild(s);
      this.coinGfx.set(coin, s);
    }

    // 终点旗
    const flag = new Sprite(Texture.from(KENNEY_PATHS.finishFlag));
    flag.anchor.set(0, 1);
    flag.x = this.level.finishX;
    flag.y = GROUND_TOP - 18;
    flag.scale.set(4);
    this.world.addChild(flag);
  }

  private buildPlayer(): void {
    this.player = new AnimatedSprite(this.frameMap.run);
    this.player.anchor.set(0.5, 1); // 锚点设在脚底中心
    // 源图侧视图（Row2/4/5）朝左绘制，牛来向右自动跑 → 水平翻转朝右；锚点(0.5,1)绕中心原地翻转不位移。
    this.player.scale.set(-SPRITE_SCALE, SPRITE_SCALE); // 整数缩放 ×3（像素风），负 x 做水平翻转
    this.player.x = START_X;
    this.player.y = GROUND_TOP;
    this.world.addChild(this.player);
    this.setAnim('run');
    this.player.play();
  }

  // ---------------------------------------------------------------- 主循环

  private update(deltaMS: number): void {
    if (!this.running || this.finished || this.failed) return;
    const dt = Math.min(deltaMS / 1000, MAX_STEP);

    // 计时器
    if (this.invuln > 0) {
      this.invuln -= dt;
      this.player.alpha = Math.floor(this.invuln * 20) % 2 === 0 ? 0.35 : 1;
    } else {
      this.player.alpha = 1;
    }
    if (this.hurtTimer > 0) this.hurtTimer -= dt;

    // 水平：自动向右奔跑
    this.player.x += RUN_SPEED * dt;

    // 垂直：重力积分
    this.velocityY += GRAVITY * dt;
    this.player.y += this.velocityY * dt;

    const onGround = this.resolveGround();
    this.checkObstacles();
    if (this.failed) return;
    this.checkCoins();
    this.checkFall();
    if (this.failed) return;

    // 终点
    if (this.player.x >= this.level.finishX) {
      this.win();
      return;
    }

    this.updateAnim(onGround);

    // 摄像机跟随（角色固定位于 CAMERA_OFFSET 处，起点不回滚）
    this.world.x = Math.min(0, CAMERA_OFFSET - this.player.x);

    // 视差滚动（基于摄像机位置）
    const camX = Math.max(0, this.player.x - CAMERA_OFFSET);
    this.bgCloud.tilePosition.x = -camX * 0.1;
    this.bgHill.tilePosition.x = -camX * 0.25;

    // 金币悬浮动画
    this.coinTime += dt;
    for (const [coin, sprite] of this.coinGfx) {
      if (!coin.collected) sprite.y = coin.y + Math.sin(this.coinTime * 4 + coin.x * 0.01) * 3;
    }

    // HUD 节流推送（≤10Hz）
    this.hudTimer += dt;
    if (this.hudTimer >= HUD_INTERVAL) {
      this.hudTimer = 0;
      this.pushHud();
    }
  }

  /** 地面碰撞：脚下有地面段且在地面顶部之下则吸附落地 */
  private resolveGround(): boolean {
    const px = this.player.x;
    let grounded = false;
    for (const seg of this.level.ground) {
      if (px >= seg.x && px <= seg.x + seg.w) {
        grounded = true;
        break;
      }
    }
    if (grounded && this.player.y >= GROUND_TOP && this.velocityY >= 0) {
      this.player.y = GROUND_TOP;
      this.velocityY = 0;
      this.lastSafeX = Math.max(this.lastSafeX, px - 30);
      return true;
    }
    return false;
  }

  /** 障碍碰撞：受击盒与障碍 AABB 相交则扣血（无敌窗口内忽略） */
  private checkObstacles(): void {
    if (this.invuln > 0) return;
    const pr = this.playerRect();
    for (const ob of this.level.obstacles) {
      if (aabb(pr, ob)) {
        this.applyDamage();
        if (this.failed) return;
      }
    }
  }

  /** 深坑检测：低于 FALL_Y 视为坠落，扣血并回到最近安全点 */
  private checkFall(): void {
    if (this.player.y <= FALL_Y) return;
    if (this.invuln <= 0) {
      this.applyDamage();
      if (this.failed) return;
    }
    this.respawn();
  }

  private respawn(): void {
    this.player.x = this.lastSafeX;
    this.player.y = GROUND_TOP;
    this.velocityY = 0;
  }

  /** 金币拾取：用身体矩形与金币矩形做 AABB 重叠，碰到即吃（避免高位金币漏判） */
  private checkCoins(): void {
    const pr = this.playerRect();
    for (const coin of this.level.coins) {
      if (coin.collected) continue;
      const coinRect: Rect = { x: coin.x - 9, y: coin.y - 9, w: 18, h: 18 };
      if (aabb(pr, coinRect)) {
        coin.collected = true;
        this.coinsCollected += 1;
        const g = this.coinGfx.get(coin);
        if (g) g.visible = false;
      }
    }
  }

  // ---------------------------------------------------------------- 状态机

  private applyDamage(): void {
    this.hp -= 1;
    this.mistakes += 1;
    this.invuln = INVULN_TIME;
    this.hurtTimer = HURT_ANIM_TIME;
    if (this.hp <= 0) {
      this.hp = 0;
      this.fail();
    }
  }

  private win(): void {
    this.finished = true;
    this.running = false;
    this.setAnim('win');
    this.pushHud();
    this.callbacks.onLevelClear({
      cleared: true,
      stars: this.computeStars(),
      levelId: this.level.id,
    });
  }

  private fail(): void {
    this.failed = true;
    this.running = false;
    this.setAnim('hurt');
    this.pushHud();
    this.callbacks.onLevelFail({
      cleared: false,
      stars: 0,
      levelId: this.level.id,
    });
  }

  private computeStars(): number {
    let stars = 1; // 通关至少 1 星
    if (this.mistakes === 0) stars += 1; // 无伤 +1
    if (this.coinsCollected >= this.level.totalCoins) stars += 1; // 满金币 +1
    return Math.min(stars, 3);
  }

  // ---------------------------------------------------------------- 动画 / 输入

  private updateAnim(onGround: boolean): void {
    if (this.hurtTimer > 0) {
      this.setAnim('hurt');
      return;
    }
    if (!onGround) {
      this.setAnim(this.velocityY < 0 ? 'jump' : 'fall');
    } else {
      this.setAnim('run');
    }
  }

  /** 切换动画（仅在名称变化时才重建，避免每帧重启动画） */
  private setAnim(name: AnimName): void {
    if (this.currentAnim === name) return;
    this.currentAnim = name;
    const frames = this.frameMap[name];
    this.player.textures = frames;
    this.player.loop = name === 'run' || name === 'idle' || name === 'win';
    this.player.gotoAndPlay(0);
  }

  private playerRect(): Rect {
    const w = FRAME_W * SPRITE_SCALE;
    const h = FRAME_H * SPRITE_SCALE;
    return {
      x: this.player.x - w / 2 + HURT_INSET_X,
      y: this.player.y - h + HURT_INSET_Y,
      w: w - HURT_INSET_X * 2,
      h: h - HURT_INSET_Y * 2,
    };
  }

  private tryJump(): void {
    if (!this.running || this.finished || this.failed) return;
    // 仅在贴地（含深坑边缘的土狼时间）时允许起跳，禁止空中二段跳
    if (this.player.y >= GROUND_TOP - 1 && this.velocityY >= 0) {
      this.velocityY = JUMP_VELOCITY;
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      this.tryJump();
    }
  };

  private onPointerDown = (): void => {
    this.tryJump();
  };

  // ---------------------------------------------------------------- HUD

  private pushHud(): void {
    const snapshot: HudSnapshot = {
      lives: this.hp,
      coins: this.coinsCollected,
      mistakes: this.mistakes,
      distance: Math.round(this.player.x),
      progress: Math.max(0, Math.min(1, this.player.x / this.level.finishX)),
    };
    this.callbacks.onHud(snapshot);
  }
}

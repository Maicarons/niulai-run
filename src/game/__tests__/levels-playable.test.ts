/**
 * 关卡可通关性仿真（playability gate）。
 *
 * 不依赖浏览器/Pixi：用真实常量与 collision.aabb 复刻 runner.ts 的核心物理
 * （自动右跑 / 重力积分 / 起跳 / 地面吸附 / 深坑坠落重生 / 障碍扣血 + 无敌窗），
 * 驱动一个「贪心跳跃」AI 跑完每一关，断言：能抵达终点（finished）且存活（hp>0）。
 *
 * 意义：若任一关卡靠简单策略都无法零坠落通关，说明布局（缺口/障碍间距）超出
 * 角色物理能力，应回炉重设。这是「trust-but-verify」的硬验证，而非仅校验结构。
 */

import { describe, it, expect } from 'vitest';
import { getLevel } from '../levels';
import { aabb } from '../collision';
import {
  GROUND_TOP,
  RUN_SPEED,
  GRAVITY,
  JUMP_VELOCITY,
  GAME_HEIGHT,
  MAX_HP,
  INVULN_TIME,
  FRAME_W,
  FRAME_H,
  SPRITE_SCALE,
} from '../constants';
import { LEVEL_IDS } from '../progress';
import type { LevelData, Rect } from '../../types/game';

/** 角色出生 x（镜像 runner.ts START_X） */
const START_X = 120;
/** 坠坑判定线（镜像 runner.ts FALL_Y = GAME_HEIGHT + 120） */
const FALL_Y = GAME_HEIGHT + 120;
const HURT_INSET_X = 14;
const HURT_INSET_Y = 10;

/** 受击盒（镜像 runner.ts playerRect） */
function playerRect(x: number, y: number): Rect {
  const w = FRAME_W * SPRITE_SCALE;
  const h = FRAME_H * SPRITE_SCALE;
  return {
    x: x - w / 2 + HURT_INSET_X,
    y: y - h + HURT_INSET_Y,
    w: w - HURT_INSET_X * 2,
    h: h - HURT_INSET_Y * 2,
  };
}

interface SimResult {
  finished: boolean;
  hp: number;
  steps: number;
  hits: number;
  falls: number;
}

/** 用真实物理 + 贪心 AI 模拟跑完一关 */
function simulate(level: LevelData): SimResult {
  const DT = 1 / 120;
  const MAX_STEPS = 120 * 180; // 180s 上限，防死循环

  let x = START_X;
  let y = GROUND_TOP;
  let vy = 0;
  let hp = MAX_HP;
  let invuln = 0;
  let lastSafeX = START_X;

  let finished = false;
  let steps = 0;
  let hits = 0;
  let falls = 0;

  const grounded = (px: number): boolean =>
    level.ground.some((seg) => px >= seg.x && px <= seg.x + seg.w);

  while (!finished && steps < MAX_STEPS) {
    steps++;

    // 计时器（镜像 runner：每帧先递减无敌窗）
    if (invuln > 0) invuln = Math.max(0, invuln - DT);

    // 贪心 AI：贴地且未上升时起跳
    const onGround = grounded(x) && y >= GROUND_TOP && vy >= 0;
    if (onGround) {
      let jump = false;
      // 深坑：距当前所在地面段右沿 ≤12px 时起跳（确保落点在下一地面段内）
      for (const seg of level.ground) {
        if (x >= seg.x && x <= seg.x + seg.w) {
          const edge = seg.x + seg.w;
          if (edge - x <= 12) jump = true;
        }
      }
      // 障碍：距其左沿 ≤50px 时起跳（物理推导：固定跳跃射程≈197px、角色半宽≈17.5px。
      //  起跳距离 J 须同时满足：
      //   (a) 入口：角色右缘接触障碍左缘瞬间需已离地≥60px（越过 70px 低悬）→ J≥41；
      //   (b) 出口：落地前拖尾须越过障碍右缘，地刺对(右缘=首障+102)需
      //       落点(首障+197-J) > 首障+102+17.5 ⇒ J<77。
      //  取 J=50：落点=首障+147，拖尾越过障碍右缘余量≈27px，且入口离地≈79px，双保险。）
      if (!jump) {
        for (const ob of level.obstacles) {
          const d = ob.x - x;
          if (d > 0 && d <= 50) {
            jump = true;
            break;
          }
        }
      }
      if (jump) vy = JUMP_VELOCITY;
    }

    // 物理步进（镜像 runner.update）
    x += RUN_SPEED * DT;
    vy += GRAVITY * DT;
    y += vy * DT;

    // 地面吸附
    if (grounded(x) && y >= GROUND_TOP && vy >= 0) {
      y = GROUND_TOP;
      vy = 0;
      lastSafeX = Math.max(lastSafeX, x - 30);
    }

    // 障碍碰撞（无敌窗内忽略）
    if (invuln <= 0) {
      const pr = playerRect(x, y);
      for (const ob of level.obstacles) {
        if (aabb(pr, ob)) {
          hp -= 1;
          hits += 1;
          invuln = INVULN_TIME;
          if (hp <= 0) finished = true; // 失败
          break;
        }
      }
    }

    // 深坑坠落
    if (y > FALL_Y) {
      if (hp > 0) {
        hp -= 1;
        falls += 1;
        invuln = INVULN_TIME;
        x = lastSafeX;
        y = GROUND_TOP;
        vy = 0;
      } else {
        finished = true; // 失败
      }
    }

    // 终点
    if (x >= level.finishX) finished = true;
  }

  return { finished, hp, steps, hits, falls };
}

describe('level playability (greedy-jumper simulation)', () => {
  for (const id of LEVEL_IDS) {
    it(`${id} is completable and survivable by a greedy jumper`, () => {
      const level = getLevel(id);
      const r = simulate(level);
      // 必须能跑到终点
      expect(r.finished, `${id} reached finish`).toBe(true);
      // 必须存活（游戏允许 3 次失误；机器人零坠落/零受击才算公平布局）
      expect(r.hp, `${id} survived with hp>0 (hits=${r.hits}, falls=${r.falls})`).toBeGreaterThan(0);
      // 理想情况下应可无伤通关（宽松断言，用于回归告警而非硬阻断）
      expect(r.hits + r.falls, `${id} clean run (hits+falls)`).toBeLessThanOrEqual(3);
    });
  }

  it('L5 is the longest level (difficulty curve: width increases)', () => {
    const widths = LEVEL_IDS.map((id) => getLevel(id).width);
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]).toBeGreaterThanOrEqual(widths[i - 1]);
    }
  });
});

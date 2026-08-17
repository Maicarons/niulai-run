/**
 * 精灵图切片：方案 B —— 逐行按「全透明列缝隙」检测帧边界（来自 asset-spec §1.2 / §1.4）。
 *
 * 为什么不采用固定 21×42 网格：源图角色横向仅 2–5px 缝隙、且各行帧宽/间距并不均匀
 * （尤其 win 行帧宽且间距大，约 22–54px pitch）。固定 21 宽网格会把一帧横跨多格、
 * 把缝隙算进帧，win 行完全对不齐 → 动画错乱。故采用动态检测，逐行得到真实帧边界。
 *
 * 行内帧区间切片（已确认·用户肉眼标定）：每个动画取所在行的帧区间 [from,to]（0-indexed 闭区间），
 * 而非整行。见 ANIM_SRC：idle=Row0[6-12] / run=jump=fall=dash=Row4[0-5] / hurt=Row5[0-5] /
 * win=Row2[7-11] / slide=Row5[1]。正面待机 Row0 左右对称，翻转无视觉影响；Row2/4/5 侧视朝左，
 * 由 runner.buildPlayer() 创建 AnimatedSprite 后做全局水平翻转朝右（行进方向）。
 *
 * PixiJS v8：子纹理通过 `new Texture({ source, frame })` 从同一 TextureSource 切割，
 * 避免重复解码，且共享 GPU 上传。
 */

import { Assets, Rectangle, Texture } from 'pixi.js';
import { SPRITE_PATHS } from './constants';
import type { AnimName } from '../types/game';

/** 动画切片来源：所在行 + 该行「检测帧」数组内的闭区间下标（0-indexed，含端点） */
interface AnimSrc {
  row: number;
  from: number; // 含
  to: number; // 含
}

/**
 * 动画 → 切片来源（用户逐行肉眼标定，已确认）。
 * from/to 为该行动画条经 detectFrames 得到的【全部】检测帧数组中的下标闭区间；
 * 代码会先取该行全部检测帧，再按 [from,to] 切片（越界 clamp，空切片回退该行首帧）。
 */
const ANIM_SRC: Record<AnimName, AnimSrc> = {
  idle: { row: 0, from: 6, to: 12 }, // 正面呼吸待机
  run: { row: 4, from: 0, to: 5 }, // 侧面奔跑
  jump: { row: 4, from: 0, to: 5 }, // 无专用跳帧，空中复用 run
  fall: { row: 4, from: 0, to: 5 }, // 同上，复用 run
  hurt: { row: 5, from: 0, to: 5 }, // 捂脸+滑铲+踉跄，受击/硬直序列
  win: { row: 2, from: 7, to: 11 }, // 欢呼/举手庆祝
  slide: { row: 5, from: 1, to: 1 }, // 滑铲单帧占位
  dash: { row: 4, from: 0, to: 5 }, // 占位，复用 run
};

/**
 * 各行动画条的 y 范围（已实测，gutter 已剥除），含于 42 单元内。
 * 见 asset-spec §1.4：行0=3–40 / 行1=45–82 / 行2=88–125 / 行3=129–166 / 行4=171–208 / 行5=213–250。
 */
const ROW_Y: Record<number, [number, number]> = {
  0: [3, 40],
  1: [45, 82],
  2: [88, 125],
  3: [129, 166],
  4: [171, 208],
  5: [213, 250],
};

/** 忽略小于此宽度的透明噪点（避免把 1–2px 缝隙误判为帧） */
const MIN_FRAME_W = 3;

/** 动画名 → 帧纹理数组 */
export type FrameMap = Record<AnimName, Texture[]>;

interface Pixels {
  w: number;
  h: number;
  /** 行主序 alpha 通道（0–255） */
  alpha: Uint8Array;
}

/**
 * 加载精灵图到离屏 canvas 并读出 alpha 通道，供缝隙检测使用。
 * 同源资源（/assets）不会污染 canvas，getImageData 可正常读取。
 */
async function readPixels(url: string): Promise<Pixels> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = data[i * 4 + 3];
  return { w, h, alpha };
}

/**
 * 对某一行的 y 范围，扫描「整列全透明」作为帧分隔，相邻非透明列段即一帧。
 * 返回每帧的 [x0, x1]（含端点）边界。内部腿缝不会全列透明，故不会被误切。
 */
function detectFrames(px: Pixels, y0: number, y1: number): Array<[number, number]> {
  const { w, h, alpha } = px;
  const yTop = Math.max(0, y0);
  const yBot = Math.min(h - 1, y1);
  const isGap = new Array<boolean>(w);
  for (let x = 0; x < w; x++) {
    let transparent = true;
    for (let y = yTop; y <= yBot; y++) {
      if (alpha[y * w + x] !== 0) {
        transparent = false;
        break;
      }
    }
    isGap[x] = transparent;
  }
  const frames: Array<[number, number]> = [];
  let start = -1;
  for (let x = 0; x < w; x++) {
    if (!isGap[x]) {
      if (start < 0) start = x;
    } else if (start >= 0) {
      if (x - start >= MIN_FRAME_W) frames.push([start, x - 1]);
      start = -1;
    }
  }
  if (start >= 0 && w - start >= MIN_FRAME_W) frames.push([start, w - 1]);
  return frames;
}

/**
 * 加载 niulai.png 并按方案 B 切出所有动画帧。
 * 若像素读取失败（如跨域污染）则回退为整行单帧，保证游戏不崩。
 */
export async function buildFrameMap(): Promise<FrameMap> {
  const base = await Assets.load<Texture>(SPRITE_PATHS.niulai);
  const map = {} as FrameMap;

  let px: Pixels | null = null;
  try {
    px = await readPixels(SPRITE_PATHS.niulai);
  } catch (e) {
    console.warn('[spritesheet] pixel slicing unavailable, fallback to single-frame rows', e);
  }

  (Object.keys(ANIM_SRC) as AnimName[]).forEach((anim) => {
    const { row, from, to } = ANIM_SRC[anim];
    const [y0, y1] = ROW_Y[row];
    let frames: Texture[];
    if (px) {
      const bounds = detectFrames(px, y0, y1); // 该行【全部】检测帧
      if (bounds.length) {
        const lo = Math.max(0, Math.min(from, bounds.length - 1));
        const hi = Math.max(lo, Math.min(to, bounds.length - 1));
        const sliceBounds = bounds.slice(lo, hi + 1); // [from,to] 闭区间切片
        const chosen = sliceBounds.length ? sliceBounds : [bounds[0]]; // 空切片回退该行首帧
        frames = chosen.map(
          ([x0, x1]) =>
            new Texture({
              source: base.source,
              frame: new Rectangle(x0, y0, x1 - x0 + 1, y1 - y0 + 1),
            }),
        );
      } else {
        // 该行无检测帧：整行单帧回退
        frames = [new Texture({ source: base.source, frame: new Rectangle(0, y0, px.w, y1 - y0 + 1) })];
      }
    } else {
      // 回退：整行作为单帧
      frames = [new Texture({ source: base.source, frame: new Rectangle(0, y0, base.width, y1 - y0 + 1) })];
    }
    map[anim] = frames;
  });

  return map;
}

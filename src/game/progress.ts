/**
 * 进度持久化（localStorage）。
 * 存储解锁关卡数与各关星级，key 固定为 niulai.progress。
 */

/** 进度存储键 */
export const PROGRESS_KEY = 'niulai.progress';

/** 关卡总数（垂直切片仅 L1 为真实关卡，其余为占位） */
export const LEVEL_COUNT = 5;

/** 关卡 id 列表（顺序即解锁顺序） */
export const LEVEL_IDS = ['L1', 'L2', 'L3', 'L4', 'L5'] as const;

import type { Progress } from '../types/game';

/** 读取进度；缺失或损坏时回退到「仅 L1 解锁」的默认值 */
export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Progress>;
      return {
        unlocked: typeof parsed.unlocked === 'number' ? parsed.unlocked : 1,
        stars: parsed.stars && typeof parsed.stars === 'object' ? parsed.stars : {},
      };
    }
  } catch {
    console.warn('[progress] 读取失败，使用默认进度');
  }
  return { unlocked: 1, stars: {} };
}

/** 写入进度 */
export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    console.warn('[progress] 写入失败（localStorage 不可用？）');
  }
}

/** 给定关卡 id，返回其解锁后的下一关索引是否合法（用于「下一关」按钮） */
export function nextLevelId(levelId: string): string | null {
  const idx = LEVEL_IDS.indexOf(levelId as (typeof LEVEL_IDS)[number]);
  if (idx < 0 || idx + 1 >= LEVEL_IDS.length) return null;
  return LEVEL_IDS[idx + 1];
}

/** 记录一次通关：更新星级（取最高）并解锁下一关；返回新进度 */
export function recordClear(
  progress: Progress,
  levelId: string,
  stars: number,
): Progress {
  const idx = LEVEL_IDS.indexOf(levelId as (typeof LEVEL_IDS)[number]);
  const starsMap = { ...progress.stars, [levelId]: Math.max(progress.stars[levelId] ?? 0, stars) };
  const unlocked = idx >= 0 ? Math.max(progress.unlocked, idx + 2) : progress.unlocked;
  return { unlocked, stars: starsMap };
}

import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { createApplication } from '../game/engine';
import { GameRunner } from '../game/runner';
import type { HudSnapshot, RunResult } from '../types/game';

/** 引擎宿主所需的回调与配置 */
export interface PixiHostConfig {
  levelId: string;
  paused: boolean;
  onHud: (snapshot: HudSnapshot) => void;
  onLevelClear: (result: RunResult) => void;
  onLevelFail: (result: RunResult) => void;
}

/**
 * 在 React 中「生命周期安全」地托管 PixiJS + GameRunner 的 Hook。
 *
 * - 挂载时异步创建 Application、加载切片、构建关卡并启动运行；
 * - 卸载（含 StrictMode 双调用）时销毁 Application 与 Runner，避免画布泄漏；
 * - paused 变化 → 驱动 runner.setPaused（暂停/恢复画面与物理）；
 * - 回调经 ref 转发，避免回调 identity 变化触发重建。
 *
 * @returns 承载 Canvas 的容器 ref
 */
export function usePixiApp(config: PixiHostConfig) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runnerRef = useRef<GameRunner | null>(null);
  const { levelId, paused } = config;

  // 用 ref 保存最新回调，确保 runner 只在 levelId 变化时重建
  const cbRef = useRef({
    onHud: config.onHud,
    onLevelClear: config.onLevelClear,
    onLevelFail: config.onLevelFail,
  });
  cbRef.current = {
    onHud: config.onHud,
    onLevelClear: config.onLevelClear,
    onLevelFail: config.onLevelFail,
  };

  useEffect(() => {
    let cancelled = false;
    let app: Application | null = null;
    let runner: GameRunner | null = null;

    (async () => {
      const parent = containerRef.current;
      if (!parent) return;

      app = await createApplication(parent);
      if (cancelled) {
        app.destroy(true, { children: true });
        return;
      }

      runner = new GameRunner(app, levelId, {
        onHud: (s) => cbRef.current.onHud(s),
        onLevelClear: (r) => cbRef.current.onLevelClear(r),
        onLevelFail: (r) => cbRef.current.onLevelFail(r),
      });
      await runner.load();
      if (cancelled) {
        runner.destroy();
        return;
      }
      runner.start();
      runnerRef.current = runner;
    })();

    return () => {
      cancelled = true;
      runnerRef.current = null;
      if (runner) runner.destroy();
      if (app) app.destroy(true, { children: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  useEffect(() => {
    if (runnerRef.current) runnerRef.current.setPaused(paused);
  }, [paused]);

  return containerRef;
}

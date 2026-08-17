import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { createApplication } from '../game/engine';
import { buildInitialScene } from '../game/scene';

/**
 * 在 React 中生命周期安全地托管 PixiJS Application 的 Hook。
 *
 * - 组件挂载时异步创建 Application 并构建初始场景；
 * - 组件卸载（含 React StrictMode 的双调用）时销毁 Application 与 Canvas，
 *   并通过 cancelled 标志避免竞态下重复挂载。
 *
 * @returns 承载 Canvas 的容器 ref，绑定到 JSX 中的 <div> 即可。
 */
export function usePixiApp() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let app: Application | null = null;
    let cancelled = false;

    async function start() {
      const parent = containerRef.current;
      if (!parent) return;

      app = await createApplication(parent);
      if (cancelled) {
        app.destroy(true, { children: true });
        app = null;
        return;
      }
      buildInitialScene(app);
    }

    void start();

    return () => {
      cancelled = true;
      if (app) {
        app.destroy(true, { children: true });
        app = null;
      }
    };
  }, []);

  return containerRef;
}

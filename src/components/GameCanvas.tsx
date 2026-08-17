import { usePixiApp } from '../hooks/usePixiApp';

/**
 * 游戏画布组件。
 *
 * 该组件本身不含任何游戏逻辑，仅通过 usePixiApp Hook 创建并挂载
 * PixiJS 渲染画布。React 负责声明式地提供一个容器节点，
 * 渲染循环与游戏状态完全由 PixiJS 侧驱动（详见 docs/architecture/）。
 */
export function GameCanvas() {
  const containerRef = usePixiApp();
  return <div ref={containerRef} className="game-canvas" aria-label="牛来游戏画布" />;
}

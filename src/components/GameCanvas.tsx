import { usePixiApp } from '../hooks/usePixiApp';
import type { HudSnapshot, RunResult } from '../types/game';

export interface GameCanvasProps {
  levelId: string;
  /** 暂停状态：true 时引擎停止物理与输入 */
  paused: boolean;
  onHud: (snapshot: HudSnapshot) => void;
  onLevelClear: (result: RunResult) => void;
  onLevelFail: (result: RunResult) => void;
}

/**
 * 游戏画布组件。
 *
 * 自身不含任何游戏逻辑，仅提供一个容器节点并托管 PixiJS 渲染循环。
 * 仅在屏幕状态为 playing / pause 时由父组件挂载（见 App 状态机与架构文档 §8）。
 */
export function GameCanvas({ levelId, paused, onHud, onLevelClear, onLevelFail }: GameCanvasProps) {
  const containerRef = usePixiApp({ levelId, paused, onHud, onLevelClear, onLevelFail });
  return <div ref={containerRef} className="game-canvas" aria-label="牛来游戏画布" />;
}

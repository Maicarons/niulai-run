export interface PauseOverlayProps {
  onResume: () => void;
  onRetry: () => void;
  onExit: () => void;
}

/** 暂停浮层（覆盖在游戏画布之上，画布保持挂载） */
export function PauseOverlay({ onResume, onRetry, onExit }: PauseOverlayProps) {
  return (
    <div className="overlay">
      <div className="overlay__panel">
        <h2 className="overlay__title">暂停</h2>
        <button className="btn btn--primary" onClick={onResume}>
          继续
        </button>
        <button className="btn" onClick={onRetry}>
          重玩本关
        </button>
        <button className="btn btn--ghost" onClick={onExit}>
          选关
        </button>
      </div>
    </div>
  );
}

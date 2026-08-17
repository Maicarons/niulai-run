import { LEVEL_IDS } from '../../game/progress';
import type { Progress } from '../../types/game';

export interface LevelSelectProps {
  progress: Progress;
  onSelect: (levelId: string) => void;
  onBack: () => void;
}

/** 选关界面：5 关占位，按 progress 顺序解锁，已解锁显示星级 */
export function LevelSelect({ progress, onSelect, onBack }: LevelSelectProps) {
  return (
    <div className="screen screen--select">
      <div className="screen__header">
        <button className="btn btn--ghost" onClick={onBack}>
          ← 返回
        </button>
        <h2 className="screen__heading">选择关卡</h2>
        <span className="screen__spacer" />
      </div>

      <div className="level-grid">
        {LEVEL_IDS.map((id, idx) => {
          const unlocked = idx + 1 <= progress.unlocked;
          const stars = progress.stars[id] ?? 0;
          return (
            <button
              key={id}
              className={unlocked ? 'level-card' : 'level-card level-card--locked'}
              disabled={!unlocked}
              onClick={() => unlocked && onSelect(id)}
            >
              <span className="level-card__no">{idx + 1}</span>
              {unlocked ? (
                <span className="level-card__stars" aria-label={`${stars} 星`}>
                  {'★'.repeat(stars)}
                  {'☆'.repeat(3 - stars)}
                </span>
              ) : (
                <span className="level-card__lock">🔒</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="screen__hint">仅 L1 开放试玩，L2–L5 为占位</p>
    </div>
  );
}

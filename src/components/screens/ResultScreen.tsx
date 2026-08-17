import type { RunResult } from '../../types/game';

export interface ResultScreenProps {
  result: RunResult;
  hasNext: boolean;
  onRetry: () => void;
  onNext: () => void;
  onMenu: () => void;
}

/** 结算界面：通关（含星级）或失败（重试/选关） */
export function ResultScreen({ result, hasNext, onRetry, onNext, onMenu }: ResultScreenProps) {
  return (
    <div className="screen screen--result">
      {result.cleared ? (
        <>
          <h2 className="screen__title screen__title--win">通关！</h2>
          <div className="result__stars" aria-label={`${result.stars} 星`}>
            {'★'.repeat(result.stars)}
            {'☆'.repeat(3 - result.stars)}
          </div>
          <div className="result__actions">
            {hasNext && (
              <button className="btn btn--primary" onClick={onNext}>
                下一关
              </button>
            )}
            <button className="btn" onClick={onRetry}>
              重玩
            </button>
            <button className="btn btn--ghost" onClick={onMenu}>
              选关
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="screen__title screen__title--fail">挑战失败</h2>
          <p className="screen__subtitle">生命耗尽，再试一次吧</p>
          <div className="result__actions">
            <button className="btn btn--primary" onClick={onRetry}>
              重玩
            </button>
            <button className="btn btn--ghost" onClick={onMenu}>
              选关
            </button>
          </div>
        </>
      )}
    </div>
  );
}

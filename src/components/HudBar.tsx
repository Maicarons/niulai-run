import { MAX_HP } from '../game/constants';
import type { HudSnapshot } from '../types/game';

export interface HudBarProps {
  hud: HudSnapshot;
  onPause: () => void;
}

/**
 * 游戏内 HUD（React 侧节流副本，≤10Hz 由引擎推送）。
 * 显示生命值（红心）、金币、失误、进度条与距离；右上角为暂停按钮。
 */
export function HudBar({ hud, onPause }: HudBarProps) {
  const pct = Math.round(hud.progress * 100);
  return (
    <div className="hud">
      <div className="hud__left">
        <div className="hud__lives" aria-label={`生命 ${hud.lives}/${MAX_HP}`}>
          {Array.from({ length: MAX_HP }).map((_, i) => (
            <img
              key={i}
              src={i < hud.lives ? '/assets/kenney/heart_full.png' : '/assets/kenney/heart_empty.png'}
              alt={i < hud.lives ? 'heart' : 'empty heart'}
              className="heart"
            />
          ))}
        </div>
        <div className="hud__stat"><img src="/assets/kenney/coin.png" alt="coin" className="hud__icon" /> {hud.coins}</div>
        <div className="hud__stat">💥 {hud.mistakes}</div>
        <div className="hud__stat">📏 {hud.distance}m</div>
      </div>
      <div className="hud__right">
        <button className="hud__pause" onClick={onPause} aria-label="暂停">
          <img src="/assets/kenney/btn_square.png" alt="pause" />
        </button>
      </div>
      <div className="hud__progress">
        <div className="hud__progress-fill" style={{ width: `${pct}%` }} />
        <span className="hud__progress-label">{pct}%</span>
      </div>
    </div>
  );
}

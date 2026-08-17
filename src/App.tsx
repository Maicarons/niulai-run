import { useCallback, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HudBar } from './components/HudBar';
import { MainMenu } from './components/screens/MainMenu';
import { LevelSelect } from './components/screens/LevelSelect';
import { PauseOverlay } from './components/screens/PauseOverlay';
import { ResultScreen } from './components/screens/ResultScreen';
import { MAX_HP } from './game/constants';
import { LEVEL_IDS, loadProgress, nextLevelId, recordClear, saveProgress } from './game/progress';
import type { HudSnapshot, Progress, RunResult, Screen } from './types/game';

/**
 * 应用根组件（屏幕状态机宿主）。
 *
 * 屏幕状态机（React 侧持有，符合 ADR-003 / 架构文档 §8）：
 *   mainMenu → levelSelect → playing → pause → result
 *
 * 关键约束：PixiJS 画布仅在 playing / pause 挂载；菜单与结算为纯 React 界面。
 * 游戏运行时状态（hp/coins/...）留在引擎侧，React 仅持屏幕状态与节流 HUD 副本。
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>('mainMenu');
  const [levelId, setLevelId] = useState<string>('L1');
  const [runKey, setRunKey] = useState(0); // 递增以强制 GameCanvas 重建（重试 / 下一关）
  const [hud, setHud] = useState<HudSnapshot>({
    lives: MAX_HP,
    coins: 0,
    mistakes: 0,
    distance: 0,
    progress: 0,
  });
  const [result, setResult] = useState<RunResult | null>(null);
  const [progress, setProgress] = useState<Progress>(() => loadProgress());

  const startLevel = useCallback((id: string) => {
    setLevelId(id);
    setResult(null);
    setRunKey((k) => k + 1);
    setScreen('playing');
  }, []);

  const handleHud = useCallback((snapshot: HudSnapshot) => setHud(snapshot), []);

  const handleClear = useCallback(
    (r: RunResult) => {
      const updated = recordClear(progress, r.levelId, r.stars);
      saveProgress(updated);
      setProgress(updated);
      setResult(r);
      setScreen('result');
    },
    [progress],
  );

  const handleFail = useCallback((r: RunResult) => {
    setResult(r);
    setScreen('result');
  }, []);

  const handlePause = useCallback(() => setScreen('pause'), []);
  const resume = useCallback(() => setScreen('playing'), []);
  const retry = useCallback(() => {
    setResult(null);
    setRunKey((k) => k + 1);
    setScreen('playing');
  }, []);
  const toMenu = useCallback(() => setScreen('mainMenu'), []);
  const toLevelSelect = useCallback(() => setScreen('levelSelect'), []);

  const nextId = result?.cleared ? nextLevelId(levelId) : null;
  const handleNext = useCallback(() => {
    const nid = nextLevelId(levelId);
    if (nid) startLevel(nid);
  }, [levelId, startLevel]);

  const inGame = screen === 'playing' || screen === 'pause';

  return (
    <div className="app">
      <div className="stage">
        {screen === 'mainMenu' && <MainMenu onStart={toLevelSelect} />}

        {screen === 'levelSelect' && (
          <LevelSelect progress={progress} onSelect={startLevel} onBack={toMenu} />
        )}

        {inGame && (
          <>
            <GameCanvas
              key={runKey}
              levelId={levelId}
              paused={screen === 'pause'}
              onHud={handleHud}
              onLevelClear={handleClear}
              onLevelFail={handleFail}
            />
            <HudBar hud={hud} onPause={handlePause} />
            {screen === 'pause' && (
              <PauseOverlay onResume={resume} onRetry={retry} onExit={toLevelSelect} />
            )}
          </>
        )}

        {screen === 'result' && result && (
          <ResultScreen
            result={result}
            hasNext={Boolean(nextId)}
            onRetry={retry}
            onNext={handleNext}
            onMenu={toLevelSelect}
          />
        )}
      </div>

      <footer className="app__footer">
        关卡 {LEVEL_IDS.indexOf(levelId as (typeof LEVEL_IDS)[number]) + 1} · 引擎 PixiJS v8 + React
      </footer>
    </div>
  );
}

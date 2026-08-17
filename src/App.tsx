import { GameCanvas } from './components/GameCanvas';

/**
 * 应用根组件。
 * UI 层（React）只负责页面布局与挂载游戏画布容器，不持有任何游戏状态。
 * 所有游戏逻辑、渲染、动画均由 PixiJS 在 GameCanvas 内独立驱动。
 */
export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">牛来</h1>
        <p className="app__subtitle">横板像素跑酷 · 技术骨架 v0.1</p>
      </header>
      <main className="app__stage">
        <GameCanvas />
      </main>
    </div>
  );
}

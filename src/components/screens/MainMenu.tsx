export interface MainMenuProps {
  onStart: () => void;
}

/** 主菜单：标题 + 开始入口（进入选关） */
export function MainMenu({ onStart }: MainMenuProps) {
  return (
    <div className="screen screen--menu">
      <h1 className="screen__title">牛来</h1>
      <p className="screen__subtitle">横板像素跑酷 · 预制作可玩切片</p>
      <button className="btn btn--primary btn--lg" onClick={onStart}>
        开始游戏
      </button>
      <p className="screen__hint">空格 / ↑ / W / 点击 跳跃 · 自动向右奔跑</p>
    </div>
  );
}

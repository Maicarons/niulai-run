import { Application, Container, Graphics, Sprite } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, GROUND_HEIGHT, COLORS } from './constants';
import { loadNiulaiSprite } from '../utils/assets';
import type { CharacterState } from '../types/game';

/** 角色占位图形尺寸（像素） */
const CHARACTER_SIZE = 48;

/**
 * 构建初始场景（最小骨架）。
 *
 * 当前仅绘制：地面（纯色矩形）+ 角色占位（纯色矩形）。
 * 真实精灵图就绪后，loadNiulaiSprite 会返回 Sprite 并替换占位图形。
 *
 * @param app 已初始化的 PixiJS Application
 */
export function buildInitialScene(app: Application): void {
  // 地面层：用一个 Container 便于后续关卡数据驱动多个平台
  const groundLayer = new Container();
  const ground = new Graphics()
    .rect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT)
    .fill(COLORS.ground);
  groundLayer.addChild(ground);
  app.stage.addChild(groundLayer);

  // 角色初始状态（占位，待状态管理模块接入）
  const initialCharacter: CharacterState = {
    position: { x: 80, y: GAME_HEIGHT - GROUND_HEIGHT - CHARACTER_SIZE },
    velocity: { x: 0, y: 0 },
    onGround: true,
    animation: 'idle',
  };

  // 角色占位图形
  const placeholder = new Graphics()
    .rect(0, 0, CHARACTER_SIZE, CHARACTER_SIZE)
    .fill(COLORS.character);
  placeholder.x = initialCharacter.position.x;
  placeholder.y = initialCharacter.position.y;
  app.stage.addChild(placeholder);

  // 预留精灵图加载：素材就位后自动替换占位图形
  void loadNiulaiSprite().then((sprite: Sprite | null) => {
    if (!sprite) return;
    sprite.anchor.set(0.5, 1);
    sprite.x = initialCharacter.position.x + CHARACTER_SIZE / 2;
    sprite.y = initialCharacter.position.y + CHARACTER_SIZE;
    app.stage.removeChild(placeholder);
    app.stage.addChild(sprite);
  });
}

import { Assets, Sprite } from 'pixi.js';
import { SPRITE_PATHS } from '../game/constants';

/**
 * 加载「牛来」角色精灵图（预留路径）。
 *
 * 该函数在素材就位前即可安全调用：若 public/assets/sprites/niulai.png
 * 尚不存在（art-director 尚未放入），会捕获异常并返回 null，
 * 由调用方回退到占位图形，从而保证 `npm run dev` 始终可运行。
 *
 * @returns 成功返回 Sprite，未找到素材或加载失败时返回 null
 */
export async function loadNiulaiSprite(): Promise<Sprite | null> {
  try {
    const texture = await Assets.load(SPRITE_PATHS.niulai);
    return new Sprite(texture);
  } catch {
    console.warn(
      `[niulai] 预留精灵图未找到（${SPRITE_PATHS.niulai}），暂用占位图形；` +
        `等待 art-director 将素材复制到该路径后自动生效。`,
    );
    return null;
  }
}

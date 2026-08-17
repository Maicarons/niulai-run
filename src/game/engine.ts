import { Application } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './constants';

/**
 * 创建并初始化一个 PixiJS v8 Application，并将其 Canvas 挂载到指定父容器。
 *
 * PixiJS v8 采用异步初始化（await app.init），初始化完成后 Application
 * 会自动启动 ticker 并在每帧渲染 stage，无需手动调用 renderer.render。
 *
 * @param parent 承载 Canvas 的 DOM 容器
 * @returns 已初始化、Canvas 已挂载的 Application 实例
 */
export async function createApplication(parent: HTMLElement): Promise<Application> {
  const app = new Application();
  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    background: COLORS.background,
    // 像素风：关闭抗锯齿以保持像素边缘清晰
    antialias: false,
    // 按设备像素比渲染，避免高分屏模糊；autoDensity 同步 CSS 尺寸
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  parent.appendChild(app.canvas);
  return app;
}

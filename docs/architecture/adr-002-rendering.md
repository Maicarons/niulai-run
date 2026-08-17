# ADR-002 · 渲染方案与游戏循环

- **状态**：已采纳（Accepted）
- **日期**：2026-08-17
- **决策者**：engineering-lead（程基岩）
- **关联**：`architecture.md` 第 3 节；`adr-001-framework.md`

## 上下文（Context）
需要确定：游戏画面如何渲染、渲染循环由谁驱动、以及渲染层与 React UI 层如何共存而不互相拖累。横板像素跑酷对帧率稳定（目标 60fps）与像素清晰度有要求，且需要把渲染结果嵌入 React 页面。

关键问题：
1. 渲染循环由 PixiJS 自管还是手动 `requestAnimationFrame`？
2. 像素风格下如何保证清晰（抗锯齿、分辨率）？
3. 如何避免游戏每帧渲染触发 React 重渲染？

## 决策（Decision）
1. **渲染由 PixiJS v8 `Application` 自管的 ticker 驱动**：`await app.init(...)` 后，Application 自动启动 ticker 每帧渲染 `stage`，不手动调用 `renderer.render`。游戏逻辑（物理步进、动画推进）注册到 `app.ticker.add(...)`，按固定逻辑步长推进，渲染插值由 PixiJS 内部处理。
2. **像素清晰度**：`antialias: false` 关闭抗锯齿；`resolution: devicePixelRatio`、`autoDensity: true` 按高分屏渲染并同步 CSS 尺寸，避免模糊。像素精灵以 `texture.source.scaleMode = 'nearest'` 保持硬边（后续接入精灵图时配置）。
3. **React 不进入渲染循环**：React 仅在挂载时提供容器节点，游戏状态变更按需（节流/事件驱动）以不可变快照推送给 React，绝不每帧 `setState`。桥接点为 `hooks/usePixiApp.ts`。

## 备选方案（Alternatives Considered）

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| **PixiJS ticker 自管（选定）** | 简单、稳定、与 v8 设计一致；逻辑与渲染分离清晰 | 需理解 fixed-step 逻辑与渲染帧的关系 | 采用 |
| 手动 rAF 循环 | 完全可控 | 重复实现 PixiJS 已有的循环与批量渲染，易出错 | 否决 |
| 把游戏状态放进 React state 每帧更新 | 概念简单 | 每帧触发 React 协调，性能灾难 | 否决（见 ADR-003） |
| 多 Canvas（UI 与游戏分离） | 彻底解耦 | 资源/同步复杂，收益有限 | 否决：当前规模单 Canvas + DOM HUD 足够 |

## 后果（Consequences）

### 正面
- 渲染循环开箱即用、性能可预期；逻辑步进可在 ticker 中以固定 delta 累积，保证手感一致。
- 像素风参数明确，后续接入精灵表即可直接获得清晰画面。
- React 与渲染解耦，UI 再复杂也不影响游戏帧率。

### 负面 / 成本
- 需要纪律：任何「游戏内数值变化 → HUD」的同步必须走受控通道（事件 / 节流快照），详见 ADR-003。
- 固定步长物理需要写「累加器 + 插值」样板（后续 Phase 实现）。

### 风险与缺口
- 视差背景、特效、对象池等高级渲染优化当前未实现，列为后续。
- WebGPU 后端为 v8 可选路径；默认走 WebGL，跨浏览器兼容性优先。

## 落地现状（Phase 3 骨架）
- `game/engine.ts`：`createApplication` 按上述参数初始化并挂载 Canvas。
- `game/scene.ts`：构建初始场景（地面 + 角色占位），并预留精灵图异步加载替换。
- `hooks/usePixiApp.ts`：完成生命周期桥接与 StrictMode/竞态安全销毁。

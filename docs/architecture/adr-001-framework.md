# ADR-001 · 技术框架选型：PixiJS + React + Vite

- **状态**：已采纳（Accepted）
- **日期**：2026-08-17
- **决策者**：engineering-lead（程基岩），经主理人 / 用户确认
- **关联**：`architecture.md` 第 1、3 节；`adr-002-rendering.md`、`adr-003-state.md`

## 上下文（Context）
「牛来」是一款横板像素跑酷（关卡制）游戏，主角是一只牛。需要在 Web 平台交付，团队已具备 React 前端经验，且用户明确选定技术栈为 **PixiJS + React + Vite**。本 ADR 记录该选型的理由，并回应在选型时可考虑的备选，以便后续成员理解约束。

核心约束与诉求：
1. 2D 像素渲染性能与开发效率（大量精灵、动画、视差背景）。
2. UI 外壳（菜单、HUD、关卡选择）需要声明式、易维护的方案。
3. 快速的开发迭代（热更新）、简单的生产打包与部署。
4. 团队技能与可维护性优先。

## 决策（Decision）
采用 **PixiJS v8（渲染）+ React 19（UI 外壳）+ Vite 7（构建）**，全部以 TypeScript strict 编写。React 与 PixiJS 通过单一桥接 Hook（`usePixiApp`）连接，明确边界：React 负责 DOM/UI，PixiJS 负责 Canvas 渲染循环与游戏世界状态。

## 备选方案（Alternatives Considered）

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| **PixiJS + React + Vite**（选定） | 渲染性能强；React 生态成熟；Vite 构建快、HMR 好；TS 友好 | 需手动管理 React/Pixi 边界，避免每帧触发 React 渲染 | 采用 |
| 纯 PixiJS（不用 React） | 无框架开销，渲染控制最直接 | UI（菜单/HUD/弹窗）需手写，维护成本高 | 否决：UI 复杂度不值得 |
| Phaser 3 | 内置场景/物理/动画/输入一体化，开箱即用 | 与 React 集成 awkward；体量较大；用户已指定 PixiJS | 否决：与既定选型冲突 |
| Unity / Godot WebGL 导出 | 引擎完整 | 非 Web 原生、包体大、与 React 团队协作成本高；用户未选 | 否决 |
| Canvas 2D 原生 | 零依赖 | 需自研渲染/批处理，像素动画与性能难保证 | 否决：重复造轮子 |

## 后果（Consequences）

### 正面
- 渲染性能优秀（WebGL/WebGPU 批处理），适合像素跑酷的精灵密集型画面。
- React 处理 UI 的声明式开发体验佳，利于后续 HUD、菜单、关卡选择扩展。
- Vite 提供极快的冷启动与热更新，缩短迭代周期。
- 依赖精简（仅 pixi.js + react + react-dom），可控。

### 负面 / 成本
- 需要纪律性约束「React 与 Pixi 的边界」：游戏状态不得放在 React state 里每帧更新（详见 ADR-003）。
- PixiJS v8 为异步初始化 API（`await app.init`），与 React 生命周期桥接需谨慎处理（已由 `usePixiApp` 解决 StrictMode 双调用与竞态）。

### 风险与缺口
- PixiJS v8 相对较新，部分旧教程基于 v7 同步 API；团队需以 v8 文档为准（已按 v8 API 实现骨架）。
- 跨平台（移动端触控）输入方案当前未覆盖，列为后续工作。

## 遵循原则
- 用户已明确选定本栈，本 ADR 主要承担「记录理由 + 标注纪律约束」，而非重新选型。

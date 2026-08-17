# ADR-003 · 游戏状态管理方案

- **状态**：已采纳（Accepted，骨架阶段仅预留接口）
- **日期**：2026-08-17
- **决策者**：engineering-lead（程基岩）
- **关联**：`architecture.md` 第 5.5 节；`adr-001-framework.md`、`adr-002-rendering.md`

## 上下文（Context）
横板跑酷涉及两类状态，诉求不同：
- **游戏运行时状态**：角色位置/速度、动画状态、关卡进度、分数、碰撞结果等。变化频率高（每逻辑帧），且由 PixiJS 渲染循环消费。若放进 React state 每帧更新，会拖垮性能。
- **UI 状态**：菜单开关、暂停、HUD 显示的数值（分数/关卡名）、设置项等。变化频率低，由 React 渲染。

需要一套方案让两者清晰分离、又能按需同步，且不引入与既定技术栈冲突的复杂依赖。

## 决策（Decision）
采用 **「游戏运行时状态（Pixi 侧可变对象） + React UI 状态（轻量 store）分离」** 的双层方案：

1. **游戏状态归属 PixiJS 侧**：以普通 TS 对象 / 类持有（如 `CharacterState`、关卡管理器、分数计数器），在 `app.ticker` 中就地 mutate，供渲染直接读取。**不**进入 React 渲染路径。
2. **UI 状态用 React 自带或轻量库**：HUD、菜单等使用 React state / Context；若状态交叉较多，引入 **Zustand**（极轻量、无 Provider 嵌套、可在非 React 模块中读写 store）作为 UI 与游戏之间的受控同步通道。
3. **同步方向受控**：游戏 → UI 仅以「事件 / 节流快照」推送（例如分数变化、关卡切换、死亡），由订阅者在 React 侧 `setState`；UI → 游戏以「命令 / 意图」下发（如暂停、重开）。**禁止**游戏每帧向 React 推送。
4. **关卡进度持久化**：解锁状态、最佳成绩等写入 `localStorage`（或后续服务端），与运行时状态分离。

当前骨架阶段仅声明核心类型（`types/game.ts` 的 `CharacterState`、`LevelData`），桥接与 store 留待玩法 Phase 接入；`utils/assets.ts` 已体现「安全回退」的加载纪律。

## 备选方案（Alternatives Considered）

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| **双层分离 + Zustand（选定）** | 性能优；UI/游戏边界清晰；Zustand 可在 Pixi 模块直接读 store | 需约定同步纪律，避免滥推 | 采用 |
| 全部状态放 React state | 简单、单一数据源 | 每帧 setState → 性能灾难 | 否决 |
| 引入 Redux / 重型状态库 | 可调试、时间旅行 | 样板重，与高频游戏状态不匹配 | 否决：过度工程 |
| 完整 ECS 自带状态系统 | 一体 | 学习/样板成本高，超出当前规模需要 | 否决（见 architecture 第 4 节） |
| 全局 EventEmitter 手动总线 | 解耦 | 易失控、难追踪依赖 | 作为补充，不单独采用 |

## 后果（Consequences）

### 正面
- 高频游戏状态不触碰 React，保证 60fps 渲染预算。
- UI 用熟悉/轻量方案，开发与维护成本低。
- Zustand 允许游戏模块与 UI 共享同一 store 而无需 React 上下文嵌套，桥接简单。

### 负面 / 成本
- 需要团队遵守「谁拥有状态、何时同步」的纪律（在控制清单 / 代码评审中固化）。
- 调试时需同时看 Pixi 侧对象与 React 侧 store，需约定日志/可观测手段。

### 风险与缺口
- Zustand 的具体接入位置与 store 形状需在玩法 Phase 设计（待 GDD 明确字段）。
- 持久化与（若后续需要）服务端存档/云同步未在本 ADR 范围，列为后续。

## 落地现状（Phase 3 骨架）
- `types/game.ts`：声明 `CharacterState`、`LevelData` 作为状态管理接入点。
- `game/scene.ts`：使用 `CharacterState` 形状的初始占位，证明状态结构可用。
- store / 同步通道：尚未建立（按计划于玩法 Phase 实现）。

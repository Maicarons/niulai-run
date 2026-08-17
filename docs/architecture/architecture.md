# 牛来 · 总体技术架构文档

> 项目：牛来（Niulai）— 横板像素跑酷（关卡制）
> 版本：v0.1（技术骨架 / Phase 3）
> 维护：engineering-lead（程基岩）
> 关联文档：`adr-001-framework.md`、`adr-002-rendering.md`、`adr-003-state.md`

本文档描述「牛来」当前技术骨架的架构与后续演进方向。当前阶段（Phase 3）仅搭建**最小可运行骨架**：一个 React 页面中启动 PixiJS，显示地面与角色占位图形，并预留精灵图加载路径。完整玩法逻辑将在后续 Phase 实现，本文中的「规划」部分标注为后续工作。

---

## 1. 技术栈总览

| 层 | 选型 | 版本 | 职责 |
| --- | --- | --- | --- |
| 渲染引擎 | PixiJS | v8（WebGL / WebGPU 2D 渲染器） | 游戏画面渲染、精灵、动画、粒子 |
| UI 框架 | React | 19 | 页面外壳、HUD、菜单等声明式 UI |
| 构建工具 | Vite | 7 | 开发服务器（HMR）、生产打包 |
| 语言 | TypeScript | 5.x（strict 模式） | 全部源码类型安全 |
| 包管理 | npm | 11.x | 依赖与脚本管理 |

**选型理由**见 `adr-001-framework.md`。核心原则：**React 与 PixiJS 各司其职**——React 负责 DOM/UI，PixiJS 负责 Canvas 渲染循环，二者通过唯一的桥接 Hook 通信，避免双向耦合。

---

## 2. 项目目录结构

```
niulaigame/
├── index.html                  # Vite 入口 HTML
├── package.json                # 依赖与脚本（dev/build/preview）
├── tsconfig.json               # TS 主配置
├── tsconfig.node.json          # TS（构建侧：vite.config）配置
├── vite.config.ts              # Vite 配置
├── .gitignore
├── docs/
│   └── architecture/           # 架构文档与 ADR（本目录）
├── public/
│   └── assets/
│       └── sprites/            # 静态资源；niulai.png 由 art-director 放入
└── src/
    ├── main.tsx                # React 渲染入口
    ├── App.tsx                 # 根组件（页面布局，不持有游戏状态）
    ├── index.css               # 全局样式
    ├── vite-env.d.ts           # Vite 类型引用
    ├── components/             # React 展示组件（UI 外壳）
    │   └── GameCanvas.tsx      # 承载 PixiJS 画布的容器组件
    ├── game/                   # 游戏核心（与 React 解耦）
    │   ├── constants.ts        # 全局常量 / 调色板 / 资源路径
    │   ├── engine.ts           # PixiJS Application 创建与初始化
    │   └── scene.ts            # 初始场景构建（地面 + 角色占位）
    ├── hooks/                  # React ↔ PixiJS 桥接
    │   └── usePixiApp.ts       # 生命周期安全地托管 Application
    ├── types/                  # 共享类型
    │   └── game.ts             # CharacterState / LevelData 等核心类型
    └── utils/                  # 工具函数
        └── assets.ts           # 精灵图加载（预留路径，安全回退）
```

**目录约定**
- `game/` 与 `hooks/` 是「渲染 / 游戏逻辑」与「React 桥接」的边界；`game/` 不 import React。
- `components/` 只做 UI 表达，不写游戏逻辑。
- `public/assets/` 下的资源通过绝对路径（如 `/assets/sprites/niulai.png`）在运行时由 PixiJS `Assets.load` 加载。

---

## 3. 渲染循环与 React 集成方式

### 3.1 边界划分
- **React 侧**：拥有 `#root` 下的 DOM 树，负责标题、HUD、菜单等 UI 外壳。React 组件**不持有游戏状态**，只声明一个容器 `<div ref={containerRef} className="game-canvas" />`。
- **PixiJS 侧**：拥有 `<canvas>`，自管渲染循环（ticker），拥有游戏世界的所有可变状态。

### 3.2 桥接机制（`hooks/usePixiApp.ts`）
- 组件挂载时，Hook 异步调用 `createApplication(parent)` 创建 `Pixi.Application` 并 `parent.appendChild(app.canvas)`。
- 初始化完成后调用 `buildInitialScene(app)` 绘制初始画面。
- 组件卸载时（含 React StrictMode 的双调用），`app.destroy(true, { children: true })` 销毁渲染器、ticker 与 Canvas，并用 `cancelled` 标志防止异步竞态下重复挂载。
- 该桥接是 React 与 PixiJS 之间**唯一**的耦合点，保证两侧可独立演进。

### 3.3 渲染循环
PixiJS v8 的 `Application.init()` 完成后会自动启动 `ticker`，每帧渲染 `stage`，无需手动调用 `renderer.render`。后续动画、物理步进均在 `app.ticker.add(...)` 回调中按固定逻辑步长推进（详见 `adr-002-rendering.md`）。

---

## 4. 实体组件系统或模块划分

**决策：不引入完整 ECS 框架，采用「轻量模块 + 数据驱动」划分。**

理由：横板 2D 跑酷规模有限（单主角 + 关卡元素 + 少量障碍/收集物），完整 ECS 的学习与样板成本高于收益。当前以清晰的模块边界 + 显式数据类型组织代码，后续若规模扩大可平滑迁移到 ECS 风格。

### 已落地模块
| 模块 | 路径 | 职责 |
| --- | --- | --- |
| 引擎初始化 | `game/engine.ts` | 创建/配置 PixiJS Application |
| 场景构建 | `game/scene.ts` | 组装初始场景图 |
| 常量配置 | `game/constants.ts` | 尺寸、调色板、资源路径 |
| 资源加载 | `utils/assets.ts` | 精灵图加载与回退 |
| 桥接 | `hooks/usePixiApp.ts` | React 生命周期 ↔ PixiJS |

### 规划模块（后续 Phase，待 GDD 明确）
| 模块 | 路径（规划） | 职责 |
| --- | --- | --- |
| 输入 | `game/input/` | 键盘 → 抽象动作映射 |
| 物理 | `game/physics.ts` | 重力、AABB 碰撞、地面检测 |
| 动画 | `game/animation.ts` | 精灵表帧动画驱动 |
| 关卡数据 | `game/level/` | 解析 `LevelData`，生成平台/障碍 |
| 状态管理 | `game/state/` + React 侧 store | 游戏状态机与 UI 同步（见 `adr-003-state.md`） |

---

## 5. 输入、物理、动画、关卡数据、状态管理方案

> 本节为**规划**，当前骨架仅预留类型与接口，未实现逻辑。

### 5.1 输入（Input）
- 键盘事件在 `game/input/InputManager` 中集中监听，映射为抽象动作：`Jump` / `MoveLeft` / `MoveRight`。
- 与渲染解耦：输入产生「意图」，由物理/角色模块消费，避免直接在事件回调里改坐标。

### 5.2 物理（Physics）
- 自研轻量 2D：重力积分 + AABB 碰撞 + 单向地面/平台检测。**不引入通用物理引擎**（跑酷不需要刚体动力学，自研更可控、零依赖）。
- 固定逻辑步长（如 60Hz）配合渲染插值，保证不同帧率下手感一致。

### 5.3 动画（Animation）
- 基于精灵表（sprite sheet）帧动画：使用 PixiJS `AnimatedSprite`，由 `animation.ts` 按角色状态（`idle`/`run`/`jump`）切换纹理序列。
- 当前 `types/game.ts` 已声明 `CharacterState.animation` 字段，作为接入点。

### 5.4 关卡数据（Level Data）
- 关卡以数据（`LevelData`）描述：平台段、障碍、收集物等坐标与属性。
- 数据来源由 design-strategist 的 GDD 驱动，序列化为 JSON/TS；`game/level/` 负责解析并生成场景对象。
- 关卡制：维护「关卡列表 + 当前关卡索引」，支持解锁/进度持久化。

### 5.5 状态管理（State）
- 采用「**游戏运行时状态（Pixi 侧可变对象）** 与 **React UI 状态（轻量 store）** 分离」方案。详见 `adr-003-state.md`。
- 游戏世界状态（`CharacterState`、关卡进度、分数等）由 PixiJS 侧持有并以不可变快照方式推送给 React（按需，如分数变化才更新 HUD），避免每帧触发 React 渲染。

---

## 6. 构建与部署流程

### 6.1 脚本
| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器（默认 http://localhost:5173，HMR） |
| `npm run build` | `tsc --noEmit`（类型检查）后 `vite build` 产出 `dist/` |
| `npm run preview` | 本地预览生产构建产物 |

### 6.2 类型安全
- `tsc --noEmit` 在打包前做全量类型检查，`strict` + `noUnusedLocals` + `noUnusedParameters` 开启；`tsconfig.node.json` 保留供编辑器对 `vite.config.ts` 做类型支持。
- 任何类型错误或「声明未使用」都会阻断 `build`，保证骨架质量。

### 6.3 部署
- 产物为纯静态文件（`dist/`），可托管于 GitHub Pages、Vercel、Netlify 或任意静态服务器（Nginx 等）。
- `vite.config.ts` 已设置 `base` 默认相对路径友好；若部署到子路径，需调整 `base`。
- 资源（`public/assets/`）会被原样拷贝到 `dist/`，运行时路径保持不变。

### 6.4 CI 建议（后续）
- 在 PR 上运行 `npm run build`（含类型检查）作为合并门禁；可选接入单元测试（Vitest）与 Playwright 烟雾测试。

---

## 7. 当前骨架验收状态（Phase 3）
- [x] Vite + React + TS 项目可初始化
- [x] PixiJS v8 集成，Application 在 React 中启动并挂载 Canvas
- [x] 显示地面（纯色矩形）与角色占位（纯色矩形）
- [x] 预留 `public/assets/sprites/niulai.png` 加载路径（`utils/assets.ts`，安全回退）
- [x] `npm run dev` 可启动；`npm run build` 可通过类型检查与打包
- [ ] UI 层：菜单 / 关卡选择屏幕状态机（架构见第 8 节，代码落地于玩法 Phase）
- [ ] 完整玩法 / 物理 / 动画 / 关卡 / 状态机（后续 Phase）

---

## 8. UI 层架构（菜单与关卡选择）

> 用户硬性要求：游戏必须包含菜单与关卡选择 UI。本节定义 UI 层的屏幕状态机、与 PixiJS 画布的挂载/桥接关系，以及关卡选择如何驱动引擎加载对应关卡数据。
> 本节为**规划**，当前骨架尚未实现；代码不改，仅补架构，落地于「玩法 Phase」。

### 8.1 屏幕状态机（Screen State Machine）
顶层屏幕状态由 **React 侧** 持有（与 ADR-003 一致：UI 状态归 React，游戏运行时状态仍留 Pixi 侧）。状态枚举：

```ts
type Screen = 'mainMenu' | 'levelSelect' | 'playing' | 'pause' | 'result';
```

状态流转：

```
            ┌─────────────┐
            │  MainMenu   │◀───────────────┐ (任意退出 / 返回主菜单)
            └──────┬──────┘                │
        选择开始   │                       │
                  ▼                       │
            ┌─────────────┐   选关并确认   │
            │ LevelSelect │───────────────▶│
            └──────┬──────┘                │
      选关确认     │ levelId               │
                  ▼                       │
            ┌─────────────┐   暂停         │
            │   Playing   │───────────────▶┌─────────┐
            └──────┬──────┘                │  Pause  │
         过关/失败  │                      └────┬────┘
                  ▼                          继续│
            ┌─────────────┐◀───────────────────┘
            │   Result    │   (success / fail)
            └──────┬──────┘
       重试/下一关  │       返回
                  ▼          │
               Playing ◀────┘ (返回关卡选择)
```

- 该状态机只决定「显示哪个屏幕」，**不直接操作游戏世界**；进入/退出 `playing` 时负责挂载或卸载 Pixi 画布。
- 由 React 顶层组件（如规划中的 `GameRoot.tsx`）用 `useState` 或轻量 store 持有 `screen` 与 `currentLevelId`。

### 8.2 屏幕与 Pixi 画布的挂载关系（桥接）
- **GameCanvas（Pixi 画布）仅在 `playing` / `pause` 状态挂载并激活**；`mainMenu`、`levelSelect`、`result` 不挂载画布（暂停时保留画布但停止 tick）。这保证菜单/选关是纯 DOM，零渲染开销。
- **主菜单与关卡选择为纯 React 组件**（`MainMenu.tsx`、`LevelSelect.tsx`），可独立视图渲染，也可作为半透明叠层覆盖在暂停的画布上（Pause 场景）。
- **通信方式**（遵循 ADR-003 的「受控同步」，绝不每帧 setState）：
  - **命令 / 意图（UI → 游戏）**：通过 props 把回调传给 `GameCanvas` / 引擎控制器——`onStartLevel(levelId)`、`onPause()`、`onResume()`、`onRetry()`、`onExitToMenu()`；进入 `playing` 时把「要加载的关卡 ID」作为 prop 传入。
  - **事件（游戏 → UI）**：引擎通过回调/事件上报 `onLevelClear(stars: 0|1|2|3)`、`onLevelFail()`；React 收到后切到 `result` 并展示星级/失败信息，并写入进度持久化。
  - 仅在大状态切换或里程碑事件时同步，运行时高频状态不进 React。
  - **HUD 快照（游戏 → UI，节流）**：引擎以 **≤10Hz** 向 React 推送 `HudSnapshot`（`lives` / `coins` / `mistakes` / `distance` / `progress` 等），HUD 组件据此渲染；字段定义与生命值（扣血制）语义见 8.6。

> 备注：角色精灵 `public/assets/sprites/niulai.png` 现已就位（已核验存在），`utils/assets.ts` 的 `loadNiulaiSprite()` 预留路径已可直接生效，进入 `playing` 后会自动加载并替换占位矩形，无需改代码。

### 8.3 关卡选择（Level Select）数据驱动
- **关卡配置**：5 关，定义为本地常量 `game/level/levels.ts` 中的 `LEVELS: LevelData[]`，复用 `types/game.ts` 的 `LevelData`（平台段、障碍、出生点等）。
- **进度持久化**：解锁状态与星级先用 `localStorage` 占位（key 如 `niulai.progress`），结构：
  ```ts
  interface Progress { unlocked: number; stars: Record<string, 0 | 1 | 2 | 3>; }
  ```
  后续可替换为服务端/云存档，接口抽象在 `game/progress/` 中，UI 不直接依赖存储实现。
- **LevelSelect 组件**读取 `LEVELS` + `Progress`，渲染 5 个关卡入口；未解锁置灰，已通关显示星级；点击已解锁关卡触发 `onStartLevel(levelId)`。

### 8.4 LevelSelect 如何驱动「加载哪一关」
- 用户在 LevelSelect 选定 `levelId` 并确认 → React 切到 `playing`，并把 `levelId` 作为 prop 传给 `GameCanvas`。
- `GameCanvas`（经 `usePixiApp` / 引擎控制器）在创建或重置引擎时调用 `loadLevel(levelId)`：从 `LEVELS` 取该关 `LevelData`，生成平台/障碍/出生点，重置角色状态与物理。
- **链路总结**：UI 仅传递 `levelId`（轻量、可序列化），引擎按 ID 拉取并实例化对应关卡。UI 与关卡内容彻底解耦——新增/调整关卡只需改 `LEVELS` 数据，不影响 UI 代码。

### 8.5 规划目录补充（后续 Phase 落地）
```
src/
├── components/
│   ├── GameRoot.tsx          # 持有 screen 状态机，条件渲染屏幕与 GameCanvas
│   ├── GameCanvas.tsx        # （已有）Pixi 画布容器，按 screen/levelId 挂载
│   └── screens/
│       ├── MainMenu.tsx      # 主菜单（纯 React）
│       ├── LevelSelect.tsx   # 关卡选择（读取 LEVELS + Progress）
│       ├── PauseOverlay.tsx  # 暂停叠层
│       └── ResultScreen.tsx  # 过关/失败结算（星级）
├── game/
│   ├── level/
│   │   ├── levels.ts         # 5 关 LevelData 常量（LEVELS）
│   │   └── loader.ts         # loadLevel(levelId)：LevelData → 场景实例化
│   └── progress/
│       └── store.ts          # 进度读取/持久化（localStorage 占位 + 可替换接口）
└── （types/game.ts 的 LevelData 已支持）
```

### 8.6 生命值与失败模型（扣血制）
用户决策：采用**扣血制**。牛来拥有生命值（建议 3 滴），撞到障碍或坠落扣 1 滴，血量归 0 才触发失败界面。

- **运行时状态（Pixi 侧，符合 ADR-003）**：在游戏运行时状态中新增 `lives`（即 `hp`）字段，初始值建议 3，由 Pixi 侧持有并就地变更；每次失误（撞障碍 / 坠落）扣 1。复用 `types/game.ts` 的运行时状态结构（如 `CharacterState` 或独立的 `RunState`），**不进 React state**：
  ```ts
  interface RunState {
    lives: number;      // 生命值（建议初始 3）
    coins: number;      // 金币
    mistakes: number;   // 失误计数
    distance: number;   // 距离
    progress: number;   // 关卡进度 0..1
  }
  ```
- **HUD 生命值显示（React 侧节流副本）**：HUD 中的生命值（爱心 / 数字）与金币、失误、进度、距离并列，由 React 侧以**受控、节流**方式同步——游戏 → UI 的 `HudSnapshot`（见 8.2 桥接）包含 `lives`，同步频率控制在 **10Hz 以内**（如每 ≥100ms 或仅在数值变化时推送），**绝不每帧 setState**。
- **失败触发条件 = hp=0**：单次失误（扣 1 滴）**不**直接弹出失败界面；仅当 `lives` 降为 0 时，引擎才上报 `onLevelFail()`，React 切到 `result(fail)`。即「失误 ≠ 失败」，失败是血量耗尽的结果。
- **失败不重置解锁进度**：进入失败结算不影响已解锁关卡与已得星级（进度持久化独立于本次 run，见 8.3）；重试从当前关卡重新开始（血量重置为满），解锁状态保持不变。
- **桥接契约补充（游戏 → UI）**：`HudSnapshot` 新增 `lives` 字段；**UI → 游戏无需新增命令**（扣血完全由引擎内部碰撞 / 坠落逻辑决定）：
  ```ts
  interface HudSnapshot {
    lives: number;
    coins: number;
    mistakes: number;
    distance: number;
    progress: number;
  }
  ```

### 8.7 验收（规划）
- [ ] 屏幕状态机 `MainMenu → LevelSelect → Playing → Pause → Result` 可正常切换
- [ ] 主菜单 / 关卡选择为纯 React 组件；GameCanvas 仅在 `playing` / `pause` 挂载
- [ ] LevelSelect 读取 5 关配置 + `localStorage` 解锁 / 星级（未解锁置灰、已通关显星）
- [ ] 选定关卡经 `levelId` 驱动引擎 `loadLevel` 加载对应 `LevelData`
- [ ] 过关/失败经事件回传 React，结算屏展示星级并写回进度
- [ ] 扣血制：失误（撞障碍/坠落）扣 1 滴（建议 3 滴），`lives=0` 才由 `onLevelFail` 触发失败界面，且失败不重置解锁进度；HUD 以 ≤10Hz 节流展示 `lives`

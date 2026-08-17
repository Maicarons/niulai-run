# 牛来跑酷 · Niulai Run

> 一只牛主角的横版像素跑酷游戏。基于 **PixiJS v8 + React 19 + Vite 7 + TypeScript** 构建。

> 🌐 在线试玩 / Live demo: https://maicarons.github.io/niulai-run/

## ✨ 特性

- 横版自动向右奔跑的像素跑酷玩法
- 牛主角使用专属精灵图（`niulai.png`），含 idle / run / jump / fall / hurt / win 等多套动画
- Kenney CC0 素材集成的场景与 UI：地面、地刺、木箱、金币、终点旗、视差背景（云 / 山）、红心、按钮
- 双层视差滚动背景，营造景深
- 金币悬浮动画 + AABB 碰撞拾取
- 生命值（3 颗心）扣血机制，受伤后短暂无敌帧
- React 屏幕状态机：`主菜单 → 选关 → 游戏中 → 暂停 → 结算`
- 关卡进度本地持久化（localStorage）

## 🛠 技术栈

| 类别 | 选型 |
| --- | --- |
| 渲染引擎 | PixiJS v8 |
| UI 框架 | React 19 + TypeScript |
| 构建工具 | Vite 7 |
| 美术素材 | Kenney Pixel Platformer / UI Pack（CC0） |

## 📁 目录结构

```
niulai-run/
├── docs/                 # 架构文档（ADR、架构说明）
├── design/               # 游戏设计文档（GDD、美术规范）
│   ├── art/
│   └── gdd/
├── public/
│   └── assets/
│       ├── sprites/      # 牛主角精灵图 niulai.png（项目自有）
│       └── kenney/       # Kenney 场景 / UI 素材（含 CREDITS.txt）
├── src/
│   ├── components/       # React 组件（画布、HUD、各屏幕）
│   ├── game/             # 游戏引擎（runner / spritesheet / levels / progress）
│   ├── hooks/            # usePixiApp 等
│   └── types/            # 类型定义
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── LICENSE               # Apache License 2.0
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18（建议使用最新的 LTS）
- npm ≥ 9

### 安装

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

启动后访问 http://localhost:5173 。

### 构建生产版本

```bash
npm run build
```

产物输出到 `dist/`。

### 本地预览构建结果

```bash
npm run preview
```

## 🎮 操作说明

| 操作 | 按键 |
| --- | --- |
| 跳跃 | `空格` / `↑` / `W` |
| 暂停 / 继续 | 点击右上角暂停按钮（暂停面板内可继续 / 重试 / 退出）|

游戏角色自动向右奔跑，你只需专注跳跃时机。

## 📖 玩法

- 自动向右奔跑，越过地刺与木箱等障碍。
- 沿途收集金币（含悬浮动画）。
- 触碰地刺 / 木箱或坠坑会扣 1 颗心，并进入短暂无敌帧。
- 抵达终点旗即通关；0 颗心则失败。
- 通关后解锁下一关（当前 L2–L5 为占位，统一复用 L1 数据）。

## 🎨 资源与署名

- **牛主角精灵图** `public/assets/sprites/niulai.png`：项目自有素材，原样使用，未做二次加工。
- **场景与 UI 素材** `public/assets/kenney/`：来自 [Kenney](https://kenney.nl) 的 **Pixel Platformer** 与 **UI Pack**，均基于 **CC0（公共领域）** 许可，并按项目调色板做了部分重新着色。详见 `public/assets/kenney/CREDITS.txt`。

## 📄 许可证

本项目基于 [Apache License 2.0](./LICENSE) 发布。

## 📌 项目状态

- ✅ 引擎、渲染、动画、碰撞、HUD、屏幕状态机、关卡进度持久化
- ✅ Kenney 场景 + UI 素材集成
- ⏳ L2–L5 真实关卡数据（当前占位复用 L1）
- ⏳ 滑铲（slide）/ 冲刺（dash）机制
- ⏳ 纯逻辑单元测试（aabb / 碰撞 / 进度）

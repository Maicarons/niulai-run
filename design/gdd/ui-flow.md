# 《牛来》UI 流程与状态归属 (UI Flow)

> 版本：v0.1 ｜ 作者：文策渊 (design-strategist)
> 关联：concept.md、core-loop.md、level-design.md、docs/architecture/adr-003-state.md
> 触发：用户硬性要求「菜单 + 关卡选择 UI」；MVP 关卡数确认为 5（见 level-design.md §3）。

## 1. 目的与边界

本文定义游戏全部界面（屏幕）的流程、玩家动词、输入方式，以及每个界面状态的**归属层**——严格遵循 engineering-lead 的 **ADR-003**：

- **React UI 层** 拥有低频 UI 状态（屏幕切换、菜单、设置、HUD 显示副本、解锁/成绩持久化）。
- **游戏运行时（PixiJS）** 拥有高频游戏状态（角色/物理/动画、实时分数与进度），每帧 mutate，不进入 React 渲染路径。
- 两者之间**受控同步**：游戏 → UI 仅事件 / 节流快照；UI → 游戏仅命令 / 意图。严禁游戏每帧向 React 推送。

## 2. 屏幕状态机 (App Screen State Machine)

屏幕切换由 React UI 层持有的 `appScreen` 状态机驱动：

```
            [启动]
               │
               ▼
         ┌──────────┐
         │ 主菜单    │◄──────────────────────────────┐
         │ MainMenu │                                  │
         └────┬─────┘                                  │
       ┌──────┼──────────┬──────────┐                 │
       ▼      ▼          ▼          ▼                 │
  [选关]   [设置]     [帮助]    [开始→选关]            │
  LevelSel Settings  Help                            │
       │ 选关/开始                                    │
       ▼                                             │
   ┌──────────┐  通关事件 ┌──────────┐                │
   │ 游戏中    │─────────►│ 过关结算  │──下一关──►(LevelSel/Playing)
   │ Playing  │          │ Result   │──重玩────►(Playing)
   │ + HUD    │          └──────────┘──选关────►(LevelSel)
   └────┬─────┘                                         │
        │ 暂停(Esc/⏸)    ┌──────────┐                  │
        └────────────────►│ 暂停菜单  │                  │
         继续────►(Playing)│ Paused   │                  │
         重开────►(Playing)└────┬─────┘                  │
         选关────►(LevelSel)◄───┘                       │
        │ 硬失败(hp=0)                                  │
        ▼                                             │
   ┌──────────┐  重试────►(Playing)                   │
   │ 失败界面  │  选关────►(LevelSel)──────────────────┘
   │ Failed   │
   └──────────┘
```

> MVP 统一从「选关」进入关卡，保证解锁逻辑一致；主菜单【开始游戏】也指向选关（或默认聚焦首个未通关关）。

## 3. 各界面详细

### 3.1 主菜单 (MainMenu)
- **元素**：标题「牛来」、按钮【开始游戏】【选关】【设置】【帮助】。
- **动词 / 输入**：
  - 鼠标 / 触摸：点按按钮。
  - 键盘：↑/↓ 或 Tab 移动焦点，Enter/Space 激活。
- **状态归属**：按钮焦点、当前选中项 = React UI；点击 → 发 `cmd:goLevelSelect` / `cmd:openSettings` / `cmd:openHelp` 意图。

### 3.2 关卡选择 (LevelSelect)
- **元素**：5 关卡片网格（L1–L5），每卡显示关卡名、主题缩略、★/★★/★★★ 最佳星级、锁定图标（未解锁）、「新」标记（未玩过）。
- **解锁规则（MVP）**：**顺序解锁**——通关 Ln 解锁 Ln+1；L1 默认解锁。最佳星级 / 时间从 localStorage 读（React UI 层）。
- **动词 / 输入**：
  - 鼠标 / 触摸：点未锁定卡片 → 进入该关；点锁定卡片 → 轻微抖动 + 提示「先通关上一关」。
  - 键盘：←/→/↑/↓ 或 Tab 导航，Enter 进入；Esc → 回主菜单。
- **状态归属**：**解锁状态、星级显示、选中焦点 = React UI**（持久化于 localStorage）。进入关卡 → 发 `cmd:startLevel(index)`。

### 3.3 游戏内 HUD (Playing + HUD)
覆盖在 Pixi 画布之上的 React 叠层（不阻挡画布输入，仅顶层按钮可点）。
- **元素**：
  - 进度 / 距离：顶部进度条（当前关前进比例）+ 距离数值。
  - 收集物计数：金币图标 + 当前 / 总金币（如 `12/15`）。
  - 生命值：❤×N（默认 `MAX_HP = 3`，如 ❤❤❤）；撞击 / 坠落 −1；归零 → 失败界面。3★「无伤」要求全程满血通关。
  - 暂停按钮：右上角 ⏸（鼠标 / 触摸点按；键盘 Esc）。
- **动词 / 输入**：
  - 鼠标 / 触摸：点 ⏸ → 暂停。
  - 键盘：Esc → 暂停（游戏运行时捕获按键 → 发 `pause:requested` 事件给 UI）。
- **状态归属**：**HUD 显示的数值是游戏运行时状态的「节流快照副本」**（React UI 层）。真实来源（`liveCoin`、`liveHp`、`levelProgress`、`distance`）在 Pixi 侧每帧 mutate，按 ADR-003 节流推送（见 §6）。

### 3.4 暂停菜单 (Paused)
- **触发**：游戏中按 Esc / 点 ⏸。
- **元素**：【继续】【重开本关】【返回选关】+（可选）音量快捷。
- **动词 / 输入**：
  - 鼠标 / 触摸：点按钮。
  - 键盘：↑/↓ 选，Enter 激活；Esc = 继续（与打开对称）。
- **状态归属**：暂停层开关、菜单焦点 = React UI。`继续`→`cmd:resume()`；`重开`→`cmd:restart()`；`选关`→`cmd:returnToSelect()`。游戏运行时在暂停时冻结 physics 步进。

### 3.5 过关结算 (Result)
- **触发**：抵达终点旗 → 游戏运行时计算星级 → 发 `level:completed{stars,timeMs,coins,hp}` → UI 切到此屏并写 localStorage。
- **元素**：星级评定动画（★/★★/★★★）、用时、收集率、剩余生命（满血 = 无伤 ★★★）、【下一关】【重玩】【选关】。
- **解锁副作用**：若通关 Ln，UI 层将 Ln+1 标记解锁（写 localStorage）。
- **动词 / 输入**：
  - 鼠标 / 触摸：点按钮。
  - 键盘：Enter = 下一关；R = 重玩；Esc = 选关。
- **状态归属**：结算数据由游戏事件带来（一次性快照，React UI 显示）；写入解锁 / 成绩 = React UI + localStorage。

### 3.6 失败界面 (Failed)
- **触发（已定：扣血制）**：牛来拥有生命值（建议 `MAX_HP = 3`，撞障碍 / 坠落 −1 滴）。**血量归零（hp = 0）时进入失败界面（硬失败）**；血量耗尽前，撞击只扣血并继续游戏，保留低重试成本的容错（见 core-loop P4）。
- **元素**：【重试本关】【返回选关】；可附「本关最佳星级」提示。
- **动词 / 输入**：
  - 鼠标 / 触摸：点按钮。
  - 键盘：Enter = 重试；Esc = 选关。
- **状态归属**：硬失败事件由游戏运行时发出（`level:failed{reason:"hp=0"}`）→ UI 切屏；按钮意图 → `cmd:restart()` / `cmd:returnToSelect()`。生命值 `hp` 本身归属游戏运行时（见 §5）。

> 设计说明：扣血制折中了「一碰即死」与「无限重试」——既有真实失败惩罚（hp=0 才失败），又对单次失误宽容（不立即重来），与心流支柱 P4 可调和。

### 3.7 设置 (Settings)
- **元素（MVP 仅基础）**：音乐 / 音效音量、控制说明（键位 / 触摸手势，可跳转帮助）、重玩进度（清空当前关最佳成绩，谨慎操作）。**不做**色盲模式与屏幕震动（MVP 阶段，见 §8）。
- **状态归属**：全部 = React UI + localStorage 持久化；音量通过 `cmd:applySettings()` 下发游戏运行时。

### 3.8 帮助 (Help)
- **元素**：操作说明（键位 / 触摸手势）、玩法目标、设计支柱简介。
- **状态归属**：纯静态 React UI；无游戏状态交互。

## 4. 输入与动词总表（菜单 / UI 域）

| 界面 | 鼠标 / 触摸 | 键盘 | 产生意图 / 事件 |
|------|-------------|------|------------------|
| 主菜单 | 点按按钮 | ↑↓/Tab + Enter | `cmd:goLevelSelect` / `cmd:openSettings` / `cmd:openHelp` |
| 选关 | 点卡片 | ←→↑↓/Tab + Enter，Esc 回主菜单 | `cmd:startLevel(i)` |
| HUD | 点 ⏸ | Esc | `pause:requested` |
| 暂停 | 点按钮 | ↑↓+Enter，Esc=继续 | `cmd:resume` / `cmd:restart` / `cmd:returnToSelect` |
| 结算 | 点按钮 | Enter=下一关，R=重玩，Esc=选关 | `cmd:nextLevel` / `cmd:restart` / `cmd:returnToSelect` |
| 失败 | 点按钮 | Enter=重试，Esc=选关 | `cmd:restart` / `cmd:returnToSelect` |
| 设置 / 帮助 | 点 / 拖动滑块 | Tab+Enter，Esc=返回 | `cmd:applySettings` |

> 易读优先（P1）：所有可点元素 ≥ 44×44 触摸热区；键盘聚焦有明确高亮描边；选关 / Esc 提供一致「返回」语义。

## 5. 状态归属矩阵（与 ADR-003 一致）

| 状态 | 归属层 | 真实来源 | 同步方式 |
|------|--------|----------|----------|
| `appScreen`（当前屏） | React UI | UI 状态机 | UI 内部；游戏事件触发切屏 |
| 菜单 / 弹层开关、焦点 | React UI | UI | UI 内部 |
| `settings` | React UI | localStorage | UI 读写；`cmd:applySettings` 下发运行时 |
| `unlockState`（解锁） | React UI | localStorage | 事件驱动（通关 → 解锁下一关） |
| `levelResults`（星级 / 时间） | React UI | localStorage | `level:completed` 事件写入 |
| HUD 显示副本（金币 / 生命值 / 进度 / 距离） | React UI | 游戏运行时快照 | 游戏 → UI **节流**推送（≤10Hz） |
| `CharacterState`（pos/vel/anim/grounded） | **游戏运行时** | Pixi 每帧 mutate | 不进 React |
| `liveCoinCount` / `liveHp`（生命值） | **游戏运行时** | 撞击/坠落 −1 | 节流推 UI 显示副本 |
| `levelProgress`(0–1) / `distance` | **游戏运行时** | 每帧计算 | 节流推 UI（进度条） |
| 碰撞 / 物理状态 | **游戏运行时** | 每帧 | 不进 React |

## 6. 同步契约（受控）

### 游戏 → UI（事件 / 节流快照，禁止每帧）
- `pause:requested` — 运行时捕获 Esc/⏸ → 请求 UI 开暂停层。
- `hud:coins(n)`、`hud:hp(n)` — 变化时推送。
- `hud:progress(p)`、`hud:distance(d)` — 节流（建议 ≤10Hz）。
- `level:completed{stars,timeMs,coins,hp}` — 抵达终点 → 切 Result + 写 localStorage。
- `level:failed{reason:"hp=0"}` — 生命值耗尽（hp=0）触发 → 切 Failed。
- `level:unlocked(i)` — 派生事件（可选，UI 亦可自行判定）。

### UI → 游戏（命令 / 意图）
- `cmd:startLevel(i)`、`cmd:nextLevel()`
- `cmd:pause()`、`cmd:resume()`、`cmd:restart()`、`cmd:returnToSelect()`
- `cmd:applySettings(settings)`

> 红线（ADR-003）：**禁止游戏每帧向 React 推送**；高频状态只在 Pixi 侧 mutate，UI 只持有节流副本。

## 7. 设计红线自检

- **认知过载（P1）**：菜单层级浅（主菜单 → 选关 → 游戏）；每屏信息聚焦；键盘焦点高亮；触摸热区 ≥44px。
- **支柱漂移**：UI 全部服务 P1(易读) / P3(关卡递进) / P4(即时反馈)；不引入偏离系统（如无内购弹窗）。
- **状态纪律（ADR-003）**：高频状态不进 React；同步方向受控——避免性能灾难与双向耦合。
- **经济**：解锁靠「通关」非金币堆量（见 concept.md 经济红线）。

## 8. 待确认 / 依赖

- **解锁模型**：MVP 顺序解锁已定；是否加「条件解锁」（如集 X 星解锁隐藏关）→ 待定。
- **设置项范围（MVP 已定）**：仅基础——音量 / 控制说明 / 重玩进度；色盲模式与屏幕震动**延后**（非 MVP），待可访问性需求确认再评估（与 art-director / engineering 协作）。
- **ADR-003 落地**：Zustand store 形状、`hud:*` 节流频率、事件名 → 待 engineering-lead 在玩法 Phase 实现时与本文对齐（本文事件名为建议契约）。
- **美术**：各界面视觉（按钮、星级、锁定图标）由 art-director 在 art-bible 落地，遵循明快像素风。

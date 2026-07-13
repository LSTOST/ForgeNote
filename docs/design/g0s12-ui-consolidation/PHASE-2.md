# PHASE-2 指令 · 交互与低保真原型（喂给 Cursor 的完整提示词）

你是 ForgeNote 仓库的执行工程师。本任务是 G0S-12 第 2 阶段：把已确认的 UX-BASE 转成线框、交互说明与可点击灰稿原型。**不碰 `src/**`。**

前提：Owner 已确认 PHASE-1 的 UX-BASE.md（含 3 个 IA 裁决的结论）。若 UX-BASE.md 中裁决项没有 Owner 结论标注，停下来先要结论。

## 先读

1. `docs/design/g0s12-ui-consolidation/UX-BASE.md`（页面清单与任务流的唯一依据）
2. `docs/design/WORKSPACE-REDESIGN-G0S10.md`（workspace 布局已冻结，线框直接沿用）
3. `docs/DESIGN.md` §3/§4/§9（间距、布局、反模式）
4. 可参考 `docs/LOW-FIDELITY-WIREFRAMES.md` 中**与 UX-BASE 页面重合的骨架**（如输入区、列表区写法），但页面清单与职责一律以 UX-BASE 为准——那份文档描述的产品已冻结。

## 产出 A · `docs/design/g0s12-ui-consolidation/WIREFRAMES.md`

8 页各一节，每节包含：

1. ASCII 线框（参考 UIUX-M2 §3 的画法），标注分区与主操作位置
2. 状态表：空态 / 加载 / 错误 / 成功，每态一句文案草稿（遵守 UX-WRITING §13）
3. 交互说明：点击/悬停/键盘行为，跳转去向
4. 与现状的差异清单（改什么、删什么、不动什么）

重点：workspace 沿用 G0S-10 模型不重画（只补状态表缺口）；**radar/account/profile/gate0/login 是从未被系统设计过的页面，是本阶段主要工作量**。

## 产出 B · `docs/design/g0s12-ui-consolidation/prototype.html`

- 单文件 HTML，零依赖，双击可开（先例：`docs/design/dsn-01-open-design/prototype.html`）
- **纯灰阶**：只用灰度 + 一个占位强调色（如纯黑），不用品牌色、不写视觉细节——本阶段只验证布局与动线，防止跳过阶段 3 的视觉决策
- 8 页可切换，能点击走通 UX-BASE 的 5 条任务流（页内跳转用锚点/JS 切换即可，无需真数据）
- 每页角落标注页名与线框编号，方便 Owner 反馈定位

## 边界

- 不碰 `src/**`，不改 tokens，不做高保真视觉。
- 不新增 UX-BASE 之外的页面或功能。

## 收尾

- roadmap G0S-12 note 追加「阶段 2 完成：8 页线框 + 灰稿原型」。
- 产出后**停下**，输出 prototype.html 的绝对路径，请 Owner 在浏览器打开点一遍。Owner 反馈的布局问题在本阶段改完，**布局冻结后才进阶段 3**。

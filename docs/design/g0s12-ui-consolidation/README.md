# G0S-12 · UI/UX 一致性重整 · 指令包总控

> 日期：2026-07-12
> 角色分工：Claude Code 出指令并复核（本包）→ Owner 拿单个阶段文件喂给 Cursor 执行 → Owner 拍板过闸
> 依据：Owner 拍板的四阶段计划（UX 设计 → 低保真 → 设计系统与实装），DECISIONS.md D-13/D-14

## 使用方法（Owner 读）

1. **每次只把一个 PHASE 文件的全文喂给 Cursor**，等它做完、停下。
2. 把 Cursor 的产出（文档/diff/截图）拿回给 Claude Code 复核，复核意见 + 你的判断 = 是否过闸。
3. 过闸后才喂下一个 PHASE 文件。**不要一次喂多个阶段**——一边做一边改的乱象就是这么来的。
4. Cursor 执行中若提出超出该阶段范围的「顺手改」，一律拒绝，记入 backlog。

## 阶段与闸门

| 阶段 | 文件 | 产出 | 闸门 |
|---|---|---|---|
| 0 基线盘点与裁决 | PHASE-0.md | AUDIT.md + 平行流产物冻结/清理 | Owner 确认审计表 |
| 1 UX 设计（当前范围） | PHASE-1.md | UX-BASE.md（旅程/IA/Flow） | Owner 确认页面清单与任务流 |
| 2 交互与低保真 | PHASE-2.md | WIREFRAMES.md + prototype.html | Owner 点完原型，布局冻结 |
| 3 UI 与设计系统实装 | PHASE-3.md | tokens + 组件收敛 + 8 页逐页实装 + UIUX-M2 全量规格 | 全页走查 + 验证全绿 |

## 全程纪律（每个阶段指令内已重复，此处存档）

1. 设计期间功能冻结：不加功能、不动引擎与 API（`src/lib/**`、`src/app/api/**` 阶段 0–2 完全不碰，阶段 3 仅 UI 层）。
2. 事实源优先级：`docs/DECISIONS.md`（冲突以此为准）> `AGENTS.md` 边界 > `docs/DESIGN.md` v2.0 > `docs/UX-WRITING.md` v1.1 > `docs/UIUX-M2.md`。
3. 冻结物不得作为设计依据：PRD-CCOS 及 CCOS 三份 UX 文档、LOW-FIDELITY-* 三份、`/ux-prototype`。
4. 每阶段结束：更新 `docs/roadmap/roadmap.json` 中 G0S-12 的 note（追加一行阶段结论），产出后**停下等 Owner**，不自行进入下一阶段。

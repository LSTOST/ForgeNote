# ForgeNote 重定义 v3.14 · 冻结送审包（To: Codex）

> 2026-07-03 冻结。Owner 已确认 UI 形态与产品定义，本包为技术负责人 review 的输入。
> 按 OPERATING-MODEL：Codex review ≠ 验收；验收另走真实用户路径 + `docs/acceptance/*.md` 证据。

## 冻结的产物清单

| 产物 | 路径 | 状态 |
|---|---|---|
| 方向文档 v3.14 | `docs/ForgeNote_重定义方向_v3.md` | 冻结（含 v3.0→v3.14 完整变更日志） |
| Design Tokens | `docs/design/redefine-2026-07/design-tokens.md` | Owner 定稿（暗色变体待确认） |
| 工作区概念稿 | `docs/design/redefine-2026-07/concept.html`（存档 `archive/concept-v3.14.html`） | 冻结 |
| 冷启动首屏概念稿 | `docs/design/redefine-2026-07/first-run.html`（存档 `archive/first-run-v3.14.html`） | 冻结 |
| 演化画廊 | `docs/design/redefine-2026-07/compare.html`（v3.0→v3.14，自包含） | 参考 |

## 产品定义（一段话）

ForgeNote = **Content Structure Generation System**，三层系统（意图层 → 结构层 → 渲染层），
唯一链路 Intent → Structure → Renderers → Recipe。初衷排序：自用 → 可用 → 顺便商业化
（第一用户 = Owner 本人；Gate 0 = Owner 连续 4 周真实周更且不想回 ChatGPT 裸聊）。
中区必须始终呈现可读内容（结构服务于内容，不替代内容）；结构层禁平台概念；
平台只存在于底部渲染层；Recipe = Structure Schema（只存槽位定义，禁存内容文本）。

## 请 Codex 重点评审的 7 个问题

1. **结构 token 词表**：`loss_open / expectation_reversal` 这类 token 是封闭枚举还是开放生成？
   封闭影响表达力，开放影响 Recipe 学习的可行性——需要词表治理方案。
2. **machine_key ⇄ human_label 映射表**：谁维护、如何随词表演化、多语言 label 怎么管
   （产品是多语言的，label 层每语言一份？）。
3. **结构稳定性判定**："结构未稳定不可生成"的判定逻辑是什么（槽位完备 + 无待决策？），
   以及待决策（如 context.granularity）的生命周期。
4. **渲染层架构**：renderer 接口设计（输入 Structure + 账号大脑上下文 → 输出格式化文本），
   "加一个平台 = 加一个薄 renderer 不动大脑"在工程上如何保证。
5. **选题雷达的数据供给**：无平台 API、无爬虫前提下（粘贴 + 人工维护领域动态），
   热度分（86/82…）的计算依据是否诚实可行，还是 MVP 应先去掉分数。
6. **Eval 生死线**：同一账号材料下，选题卡与结构质量对比"ChatGPT 裸聊"基线的盲测方案
   （这是 Gate 1 硬标准，方向文档 §4/§7）。
7. **Gate 0 埋点**：Owner 自用四周要回答"离不离得开"，最小要记什么
   （每次任务的完成率/回聊 ChatGPT 的次数/回填率）。

## 已知裁量与待 Owner 确认项

- 暗色 tokens 变体是 Claude Code 提案（design-tokens.md 附录），未经 Owner 逐值确认。
- Recipe 沉淀已定为后台机制（无用户按钮）；「存为配方」在 v3.13 输出条出现过、
  v3.14 高保真稿中移除——以 v3.14 为准，配方复用走「结构模板库」入口。
- M1 范围：结构做 Narrative + Visual 两类；renderer 做 小红书 / X / 图片 Prompt 三个；
  Temporal 与视频类 renderer 延后（方向文档 §4）。

---

## 附：发给 Codex 的指令（Owner 直接粘贴使用）

**角色**：你是 ForgeNote 的技术负责人（Codex），按 `docs/OPERATING-MODEL.md` 的角色与 gate 模型执行本次架构 review。

**背景**：产品已完成重定义，v3.14 已冻结在分支 `docs/redefine-v3-freeze`（commit `05dcc66`）。
入口文件：`docs/design/redefine-2026-07/REVIEW-HANDOFF.md`。
通读顺序：REVIEW-HANDOFF.md → `docs/ForgeNote_重定义方向_v3.md`（重点 §2/§4/§5/§7）→
`concept.html` / `first-run.html`（浏览器打开可交互）→ `design-tokens.md`；
`compare.html` 为演化背景参考，不需逐版评审。

**Review 范围与边界**：
1. 只评技术可行性与架构正确性，**不重开方向讨论**——产品定义与 UI 形态已经 Owner 拍板；
   发现方向级矛盾时单独列"方向级异议"一节供 Owner 裁决，不得直接改方向文档。
2. 逐条回答本文件的 7 个重点评审问题，每条给出：结论 / 推荐方案 / 风险 / 是否 blocker。
3. 列出方向文档与概念稿之间的不一致处（如有）。
4. 评估代码资产保留/拆除边界：auth（DSN-02）与生成 pipeline 基建保留，
   `/forge` 表单流程与旧 recipes 体系拆除——确认拆除清单技术上干净可行。

**产出**：写入 `docs/design/redefine-2026-07/CODEX-REVIEW.md`，末尾附 **M2 建议票列表**
（以 Gate 0 为唯一目标倒排，标注票间依赖）。

**约束**：本次 review ≠ 验收（验收走真实用户路径 + `docs/acceptance/*.md` 证据）。
M1 范围铁线：结构只做 Narrative + Visual；renderer 只做 小红书 / X / 图片 Prompt；
Temporal 与视频延后。

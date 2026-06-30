# DSN-02 — 登录页认证缺口补齐 + 视觉融合（Brief）

> 用途：DSN-02 票的执行 brief 与指令存档。票正文见 `docs/TICKETS.md`「待评估设计票」段。
> 来源：Owner 拍板方向，Claude Code 代为整理；认证技术边界 / 排期 / 拆票由 Codex 定。
> 关联：PR #24（本票）；与进行中的 V-01-FIX-09 重叠，需 Codex 裁决关系。

## 背景与现状（必须在此基础上做，不推翻）

登录页已由 V-01-FIX-04 ~ FIX-08 改造完成：

- 邮箱+密码为主登录（`signInWithPassword`，FIX-04）；Google 备选。
- Sign In / Sign Up 同页切换（`passwordMode`，FIX-05）。
- 注册后邮箱验证（`signUp` + `emailRedirectTo` → `signupSent` 待验证态）。
- 暖纸感视觉系统（FIX-07/08）：纸感点阵背景、品牌标、ForgeNote serif 标题、分类副标题、深橙主按钮 `#B5562B`、暖色表单 `#FFFDF9` 底 / `#E3D8C7` 边。

## Owner 本轮新决策（DSN-02 要做的）

1. 彻底移除 Magic Link 登录（`signInWithOtp` / magicState / magicBackupHint / sendMagicLink 全部下线）。
2. 新增「忘记密码 / 密码重置邮件流程」（含重置页路由）。
3. 新增「记住 30 天」复选框 + 会话时长策略。
4. 视觉融合：在暖纸感系统内融入「活泼彩色角色 + 眼睛动效」（参考 careercompassai 登录页的角色 + 眼睛动效感觉），克制、协调，不推翻 FIX-08。
5. Logo 沿用现有品牌标，不新设计。
6. 老用户迁移：Google 用户继续用 Google；仅 Magic Link 老用户经新「忘记密码」流程设密码 —— 迁移路径须先于 Magic Link 下线可用。

---

## 指令存档 ①：发给 Codex

```text
@Codex 新增了 DSN-02 票（PR #24，已落 docs/TICKETS.md「待评估设计票」段）。这是登录页的认证缺口补齐 + 视觉融合，方向我已拍板，请你按技术负责人 + QA 闸来处理，重点是定边界和裁决，不要直接放给实现。

需要你做 4 件事：

1. 裁决与 V-01-FIX-09 的关系
   DSN-02 和你正在做的 FIX-09（登录/注册模式辨识 + Magic Link 负担）高度重叠。
   请明确：DSN-02 是取代 / 承接 / 合并 FIX-09？给一个结论，避免双线打架。

2. 定认证技术边界（实现前必须锁，写进票/DECISIONS）
   - 「记住 30 天」的 session / refresh token 实现方式。
   - 密码重置 redirect URL（Production + Preview wildcard，呼应历史 OAuth redirect 经验）。
   - 密码策略（最小长度/强度）、速率限制 / 防爆破；登录失败信息不泄露账号是否存在。
   - 迁移顺序硬约束：忘记密码流程必须先可用，再下线 Magic Link，否则只用 Magic Link 的老用户会被锁外。

3. 记 DECISIONS
   「彻底去掉 Magic Link」+「新增邮箱密码重置」属认证方式变更，请记一条 D-记录。

4. 排期裁决（重要）
   我的倾向：先冻结登录（FIX-09 合入即止）、先用 1 个真实非构建者用户跑 V-01 拿到第一份真实证据，
   再做 DSN-02 实现。登录已打磨九轮但零真实外部用户跑通，继续打磨是在回避验证。
   你同意「V-01 先行、DSN-02 实现排在 V-01 收口之后」吗？给结论。

边界确认后再拆实现票给 Claude Code，不要跳过 Gate。
```

---

## 指令存档 ②：发给 Claude Design

```text
@Claude Design 需要一版 ForgeNote /login 的视觉 + 动效融合稿。票：DSN-02（docs/TICKETS.md）。

现状（必须在此基础上做，不是推翻重来）：
登录页已改成「暖纸感」系统（FIX-07/08 已上线）——纸感点阵背景、品牌标、ForgeNote serif 标题、
分类副标题、深橙主按钮(#B5562B)、暖色表单(#FFFDF9 底 / #E3D8C7 边)。Logo 沿用现有标，不要新设计。

任务：
把「活泼彩色角色 + 眼睛动效」克制地融进现有暖纸感系统，做到协调、不冲突、不浮夸。
参考动效与角色感：https://careercompassai.vercel.app/login
（只借角色 + 眼睛动效的感觉，不要照抄它的具体角色形象，也不要它的冷白 SaaS 风。）

最终表单字段（请按这个画，和现状有出入要标出来）：
- 邮箱 + 密码（含显示/隐藏密码眼睛）
- 「记住 30 天」复选框（新增）
- 「忘记密码？」链接（新增）
- 主按钮：登录
- 次按钮：使用 Google 登录
- Sign In / Sign Up 同页切换
- 不要 Magic Link（已决定移除）

还要覆盖这些页/态的稿：
- 忘记密码：请求重置 →「重置邮件已发送」→ 重置密码页 → 设新密码 → 完成
- 注册：同页切换 +「注册邮件已发送，待验证」态
- 登录失败 / Google 登录中 / env 未配置「未配置」态

交付物（落 docs/design/dsn-02-login-auth/）：
- 高保真稿：桌面 + 移动
- 动效规格：每个动效的触发时机 / 时长 / 缓动，且必须给 prefers-reduced-motion 降级方案
- 与当前 /login 的差异清单
- 中英文文案清单（最终进 src/lib/copy）
- handoff.md

约束：
- 用现有 Next.js / shadcn / Tailwind + 暖色系统可落地，不引新字体/远程资源。
- 可访问性：对比度、键盘可操作、焦点态、密码可见切换 aria 标注。
- 动效克制，不拖慢首屏。
```

---

## 并行与排期提醒

- Claude Design 可与 Codex 并行：视觉融合不依赖认证后端，但稿子必须按上面「最终字段」（无 Magic Link、有记住30天/忘记密码）画。
- 给 Codex 的指令保留了「V-01 先行」的排期问句——待 Codex 表态后由 Owner 定。

# DSN-02 Login — Design Handoff（Claude Design 填写）

> 用途：Claude Design 把融合稿的可实现规格填进本表，Claude Code 据此在项目现有
> Next.js / shadcn / Tailwind 栈里重写实现（不直接复制原型 HTML）。
> 关联：`docs/design/dsn-02-login-auth/brief.md`、DSN-02 票（`docs/TICKETS.md`）、
> 设计语言基线 `docs/design/dsn-03-core-ux-map/design-system-baseline.md`。
> 现状基线：暖纸感系统（FIX-07/08）——纸感点阵背景、品牌标、ForgeNote serif 标题、
> 深橙主按钮 `#B5562B`、暖色表单 `#FFFDF9` 底 / `#E3D8C7` 边。本票在此之上做「角色+眼睛动效」融合，logo 沿用现有标。
>
> **本次融合一句话**：在暖纸感系统上加一层「Ember 一家」——一组**暖色**小 spark 角色，
> 瞳孔随光标看你、聚焦密码时抬手捂眼、成功笑、失败皱眉。只借 careercompassai
> 「一群小家伙看着你」的**感觉**，配色/形象全部原创暖纸系，不抄其具体角色、不做冷白 SaaS 风。
>
> 交付物：本 `handoff.md` + `prototype.html`（可点击高保真桌面+移动）+ `screenshots/`。
> 决策层级（基线 §0）：**1 工作台清晰 > 2 暖纸氛围 > 3 灵动角色**。角色动效仅入口页允许，克制、只在交互时发生、不做首屏自动播放。

## 0. 产物清单（勾选已交付）

- [x] `prototype.html`（可点击高保真，桌面 + 移动；颜色/间距可量真值；离线、无远程字体/图片）
- [x] `desktop.png` → `screenshots/login-default-desktop.png`
- [x] `mobile.png` → `screenshots/login-default-mobile.png`
- [x] 各状态截图（见 §4）
- [x] 本 `handoff.md` 填写完成

> 说明：`prototype.html` 是**规格参照**（可用取色器/标尺量真值、可点击走通交互与动效），
> 不作为实现代码；Claude Code 按本表在现有栈重写 `LoginForm` 等组件。

## 1. 设计 Token

> 只列与登录页相关的；沿用现状值的写「沿用」。值以 `prototype.html` `:root` 为准。

| 类别 | Token / 用途 | 值 | 备注 |
|---|---|---|---|
| 颜色 | 页面背景（移动/全页） | `#F5EFE6` | 沿用（现 `/login` page.tsx 底色） |
| 颜色 | 桌面左侧角色区底 | `#EEE0C9` | 新增；比页面底深一档，衬托角色 |
| 颜色 | 桌面右侧表单区底 | `#FBF7F0` | 新增；基线 surface/base，表单更亮更清晰 |
| 颜色 | 点阵纹理 | `radial-gradient(rgba(120,90,50,.05) 1px, transparent 1px)`；size 移动 `5px` / 角色区 `6px` | 沿用点阵语言 |
| 颜色 | 主按钮（登录/主操作） | `#B5562B` | **沿用** |
| 颜色 | 主按钮 hover / active | hover `#9F4924` | 沿用基线 accent/hover |
| 颜色 | 主按钮文字 | `#FDF7EF` | 沿用 |
| 颜色 | 输入框背景 / 边框 | `#FFFDF9` / `#E3D8C7` | **沿用** |
| 颜色 | 输入 focus | 边框 `#B5562B` + `0 0 0 3px rgba(181,86,43,.28)` | 沿用基线 focus/ring |
| 颜色 | 次按钮（Google，outline） | 边框 `#E3D8C7` / 字 `#6f6253` / hover 底 `rgba(255,253,249,.65)` | 次操作，不与主按钮同重量 |
| 颜色 | 链接（忘记密码、切换注册、显示密码） | `#B5562B`（强调链接）/ `#9c7a52`（次级链接如「返回登录」） | 链接**加下划线或加粗**，不只靠颜色 |
| 颜色 | 主文字 / 次文字 / 占位 | `#33291F` / `#6f6253` / `#8a7d6c`(说明) `#8b8378`(输入占位) | ink primary 沿用现状 `#33291F`（基线建议 `#2A2320`，如需更高对比可改） |
| 颜色 | 错误态 | 字 `#9E3322` / 边 `rgba(181,60,40,.30)` / 底 `rgba(181,60,40,.06)` | 沿用；表单级 `role="alert"` |
| 颜色 | 成功态 | `#2F7A4F` | 基线 status/success（用于「重置完成」等文案点缀） |
| 字体 | 品牌标题 | `'Newsreader', ui-serif, Georgia, 'Songti SC', serif` | **沿用**，本地 fallback，不引远程字体 |
| 字体 | 正文 / 标签 / 按钮 | `'Geist', system-ui, -apple-system, ...` | **沿用**，系统无 Geist 退 system-ui |
| 字号/行高 | 标题 | 桌面 `32` / 移动 `31`，行高 `1.05` | serif medium(500)，`letter-spacing:-.015em` |
| 字号/行高 | 副标题 / 分类线 / 标签 | 副标题 `14`(行高1.5) / 分类线 `12–13`(`letter-spacing:.06em`) / label `13`(600) | 分类线色 `#9c7a52` |
| 字号/行高 | 输入 / 按钮 | 输入 桌面 `15` / **移动 `16`**（防 iOS 缩放）；主按钮 `15`(600)、次按钮 `14`(500) | |
| 间距 | 容器宽度（桌面/移动） | 桌面表单 `380`；移动 `350`（`390 − 2×20` 安全边距） | **沿用** |
| 间距 | 字段垂直节奏 | label↔input `7`；字段间(auth) `16`；label 与区块 `26`(标题下)；重置页字段 `13–14` | 4px 基（基线 §3） |
| 圆角 | 输入 / 按钮 / 卡片 / 品牌标 | 输入&按钮 `13`；提示卡 `14`；品牌 mark `11`；复选框 系统默认 | 沿用 |
| 阴影 | 主按钮 / 提示卡 / 桌面卡外框 | 按钮 `0 2px 10px rgba(150,70,30,.22)`；提示卡 `0 1px 10px rgba(120,90,50,.06)`；卡外框 `0 18px 50px -24px rgba(80,50,20,.4)` | 卡外框仅原型演示用，落库可省 |
| 尺寸 | 控件高度 | 桌面 `44` / 移动 `46`；触控目标 ≥44 | 沿用基线 §4/§5 |

## 2. 布局与角色融合

- **布局结构**：
  - 桌面：左右分屏卡片（原型演示 `920×600`）。左 `372px` 角色区（`#EEE0C9` + 点阵，左上品牌锁定件），右表单区（`#FBF7F0`），内含 `380px` 表单垂直居中。
  - 移动：**优先级单列**（基线 §9），不复制桌面分区。顺序：角色(单个,居中) → ForgeNote 标题 → 分类线 → slogan → 邮箱 → 密码 → 记住/忘记 → 登录 → 分隔「或」 → Google → 切换注册。左右 `20` 安全边距，无横向溢出。
- **角色元素**：桌面为「Ember 一家」四口（暖色 spark：高陶土 `#C2743F` / 深可可 `#6E4327` / 琥珀拱 `#E4A95C` / 橙拱带嘴 `#D98A5A`，均暖纸系），坐落左区底部、约占左区 70% 高；移动为单个 Ember（`120px`，圆身+小火苗，呼应闪电标）。角色**只在交互时动**（跟随/捂眼/笑/皱眉），不做浮动循环、不首屏自动播放，颜色与暖纸底同族，不喧宾夺主。
- **Logo**：**沿用**现有闪电（Zap）品牌标——`38px`、圆角 `11`、深橙 `#B5562B` 底、`#FDF7EF` 图标。桌面放左上锁定件（mark + `ForgeNote` serif）；移动由顶部角色 + serif 标题承担品牌，mark 可选。**不新设计 logo。**
- **与参考页 careercompassai 的差异**：只借「一组带眼睛的小角色、瞳孔随光标、聚焦密码会有反应」的**感觉**；配色全暖纸（非冷白/紫蓝），角色为原创暖 spark 家族（非其具体角色形象），无冷白 SaaS 调性；角色服务「第一印象 + 人情味」，服从基线决策层级 3。

## 3. 动效规格（必须可实现 + 必给降级）

> 截图表达不了动效，这一节是实现动效的唯一依据。仅用 `transform/opacity`、合成层；指针跟随 rAF 节流；转场 ≤220ms；无首屏自动播放。

| 动效 | 触发时机 | 时长 | 缓动 | 循环? | prefers-reduced-motion 降级 |
|---|---|---|---|---|---|
| 角色入场 | 页面加载 | 静态（可选 opacity 0→1，240ms，一次） | ease-out | 否 | 直接显示，无 fade；首屏不依赖它 |
| 眼睛跟随光标 | 桌面 `pointermove`（角色区内） | 瞳孔补间 ~140ms 到目标 | ease-out | 否（持续响应） | **关闭跟随**，瞳孔居中 |
| 眨眼 | 闲置计时，每 `2600–6400ms` 随机（仅 idle / email-glance 态） | ~125ms（open↔闭合 lid 的 opacity 切换） | ease | 是 | **关闭眨眼**，保持睁眼 |
| 聚焦邮箱（glance 看输入框） | email `focus` | 140ms | ease-out | 否 | 不动（瞳孔居中） |
| 聚焦密码（捂眼 cover） | password `focus` 且未显示密码 | 眼睛闭合 90ms + 抬手捂眼（opacity 200ms / 弹性位移 240ms `cubic-bezier(.34,1.45,.5,1)`） | 见左 | 否 | 眼睛**瞬间闭合**（opacity 直接切）、手无弹性；不看密码这一功能保留 |
| 显示密码（avert 移开视线） | 点「显示密码」眼睛图标（showPw=true）且 pw focus | 手放下 + 身体轻侧转（rotate ~-7°、translate） 220ms | ease-out | 否 | 瞬切，无旋转/位移补间 |
| 角色闲置微动 | —— | **默认无浮动循环**（基线：安静，不与内容争注意力）；仅眨眼 | —— | 否 | 关闭 |
| 输入框聚焦 | input `focus` | 边框+ring 130ms | ease | 否 | 可保留即时切换（focus 可见性是**可访问性必需**，非装饰） |
| 按钮 hover / 点击 | hover / submit | hover 130ms；提交 spinner `spin .8s linear` | linear（spinner） | spinner 是 | 颜色即时；spinner 放慢到 `~1.4s`，**不闪烁** |
| 状态切换过渡（登录↔注册↔忘记密码↔重置） | 切换点击 | 内容块 `display` 即时切换 + 文案更新；角色 setPose（眼 140 / 身 220） | ease-out | 否 | 姿态瞬切，无补间 |
| 成功（重置完成等） | 状态=成功 | 角色 happy（眼弧）+ 轻跳 `emHop .62s`（一次） | ease | 否 | 无跳，表情仍 happy |
| 失败（登录错误） | 状态=错误 | 角色 worried（皱眉+皱嘴）+ 横向轻晃 `emShake .42s`（一次） | ease | 否 | 无晃，表情仍 worried |

- **动效不得拖慢首屏**：关键内容（标题、表单字段、主/次按钮、`未配置`提示）为静态 HTML/CSS，渲染与可操作性**不依赖 JS 动效**；角色 SVG 内联、无外部请求；所有动效仅 `transform/opacity`；无首屏自动播放；跟随用 `requestAnimationFrame` 节流。
- **实现要点**：眼睛「闭合/眨眼/捂眼」用**元素 opacity 切换**（睁眼 leaf 与闭眼 lid 两套形态），不要用 `transform: scaleY`（更稳、也利于降级与静态渲染）；瞳孔跟随可用 transform。姿态状态机建议：`idle | glance | cover | avert | happy | worried | loading`。

## 4. 字段与状态稿

> 最终字段（已定）：邮箱 + 密码（含显示/隐藏眼睛）、记住 30 天、忘记密码链接、
> 登录主按钮、Google 次按钮、Sign In/Sign Up 同页切换。**无 Magic Link。**

| 状态 | 稿文件（`screenshots/`） | 说明 |
|---|---|---|
| 登录 默认（桌面） | `login-default-desktop.png` | 左角色一家看向表单，右表单：邮箱→密码(眼睛)→记住30天(默认勾)+忘记密码→登录→或→Google→切换注册 |
| 登录 默认（移动） | `login-default-mobile.png` | 单列，角色居中置顶；输入 16px；左右 20 边距 |
| 密码聚焦·捂眼（交互演示） | —（静态图无法表达闭眼/捂眼；见 `prototype.html` 实时交互） | 聚焦密码：角色闭眼 + 抬手捂眼（不看你的密码）。**此态以动效为主，请在 `prototype.html` 中点击密码框实时查看** |
| 登录 提交中 | `login-submitting.png` | 主按钮内 spinner + 「登录中…」，按钮 disabled；角色 loading（半眯向上看） |
| 登录 失败（不泄露账号是否存在） | `login-error.png` | 顶部 `role="alert"`「邮箱或密码不正确，请检查后重试。」+ 角色皱眉轻晃；不区分账号是否存在 |
| 注册（同页切换） | `signup.png` | 标题「创建账号」、密码占位「设置密码（至少 8 位）」、切换文案「已有账号？返回登录」 |
| 注册 已发送待验证 | `signup-sent.png` | 提示卡「确认邮件已发送」+ 邮箱高亮 + 「换一个邮箱」，角色 happy |
| 忘记密码 请求 | `reset-request.png` | 标题「重置密码」、单邮箱字段、「发送重置邮件」、「← 返回登录」 |
| 忘记密码 已发送 | `reset-sent.png` | 提示卡「重置邮件已发送」+ 邮箱高亮 + 「没收到？重新发送」，角色 happy |
| 重置密码页（设新密码） | `reset-new-password.png` | 新密码(眼睛)+确认新密码+「保存新密码」；角色 cover（设密码时不看） |
| 重置完成 | `reset-done.png` | 「新密码设置成功，现在可以用它登录了。」+「去登录」，角色 happy + 轻跳 |
| Google 登录中 | `google-redirecting.png` | 「正在跳转到 Google…」+ 次按钮内 spinner，disabled；角色 loading |
| env 未配置「未配置」提示 | `not-configured.png` | `role="alert"` 卡：「登录暂不可用：Supabase 未配置」+ 缺失变量说明；替换整表单，避免白屏 |
| 记住 30 天 勾选/未勾选 | 勾选见 `login-default-desktop.png`；未勾选 `remember-unchecked.png` | 默认**勾选**；复选框 `accent-color:#B5562B` |

## 5. 文案清单（中英，最终进 `src/lib/copy/{zh-Hans,en}.ts`）

> 沿用现有 `login.*` 结构；**删除** `magicBackupHint / sendMagicLink / magicSent*`；**新增** 记住/忘记/重置相关 key。`{email}` 由调用处注入。

| key（建议） | zh-Hans | en | 出现位置 |
|---|---|---|---|
| login.title | 欢迎回来 | Welcome back | 登录标题 |
| login.subtitle | 输入邮箱和密码，继续锻造你的内容 | Enter your email and password to keep forging | 登录副标题 |
| login.signupTitle | 创建账号 | Create account | 注册标题 |
| login.signupSubtitle | 填邮箱和密码，开始使用 ForgeNote | Add an email and password to start using ForgeNote | 注册副标题 |
| login.categoryLine | 图文卡片内容工作台 | Visual card content studio | 品牌分类线（沿用现状中文） |
| login.emailLabel | 邮箱地址 | Email | 邮箱 label |
| login.emailPlaceholder | you@example.com | you@example.com | 邮箱占位（沿用） |
| login.passwordLabel | 密码 | Password | 密码 label |
| login.passwordPlaceholder | 输入密码 | Enter password | 登录密码占位 |
| login.passwordPlaceholderSignup | 设置密码（至少 8 位） | Set a password (min 8 chars) | 注册密码占位 |
| login.showPassword（aria） | 显示密码 | Show password | 眼睛按钮 aria-label |
| login.hidePassword（aria） | 隐藏密码 | Hide password | 眼睛按钮 aria-label |
| login.rememberFor30Days | 保持 30 天登录 | Stay signed in for 30 days | 记住复选框 |
| login.forgotPassword | 忘记密码？ | Forgot password? | 忘记密码链接 |
| login.submit | 登录 | Sign in | 登录主按钮 |
| login.submitting | 登录中… | Signing in… | 提交中 |
| login.signupSubmit | 创建账号 | Create account | 注册主按钮 |
| login.google | 使用 Google 登录 | Continue with Google | Google 次按钮（沿用） |
| login.googleRedirecting | 正在跳转到 Google… | Redirecting to Google… | Google 登录中 |
| login.orDivider | 或 | or | 分隔线 |
| login.toSignUpPrompt / link | 还没有账号？ / 创建账号 | No account yet? / Create one | 切到注册 |
| login.toSignInPrompt / link | 已有账号？ / 返回登录 | Already have an account? / Back to sign in | 切回登录 |
| login.error.invalidCredentials | 邮箱或密码不正确，请检查后重试。 | Email or password is incorrect. Please check and try again. | 失败（**不泄露账号是否存在**） |
| login.signupSentTitle | 确认邮件已发送 | Confirmation email sent | 注册待验证 |
| login.signupSentBody | 我们已向 {email} 发送确认邮件。首次点一次确认即可，之后用邮箱和密码直接登录。 | We've sent a confirmation email to {email}. Confirm once, then sign in with email and password. | 注册待验证 |
| login.changeEmail | 换一个邮箱 | Use a different email | 注册待验证 |
| login.notConfigured（title/body） | 登录暂不可用：Supabase 未配置 / 缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY，请在环境变量中配置后重试。 | Sign-in unavailable: Supabase not configured / Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in your environment and retry. | env 未配置 |
| reset.title / subtitle | 重置密码 / 输入注册邮箱，我们会发一封重置链接给你 | Reset password / Enter your account email and we'll send a reset link | 忘记密码请求 |
| reset.submit | 发送重置邮件 | Send reset email | 忘记密码请求 |
| reset.backToSignIn | ← 返回登录 | ← Back to sign in | 忘记密码请求 |
| reset.sentTitle / sentBody | 重置邮件已发送 / 我们已向 {email} 发送重置链接。打开邮件点链接，即可设置新密码。 | Reset email sent / We've sent a reset link to {email}. Open it and follow the link to set a new password. | 已发送 |
| reset.resend | 没收到？重新发送 | Didn't get it? Resend | 已发送 |
| reset.newTitle / newSubtitle | 设置新密码 / 给账号设置一个新密码（至少 8 位） | Set a new password / Choose a new password for your account (min 8 chars) | 重置页 |
| reset.newPasswordPlaceholder | 新密码（至少 8 位） | New password (min 8 chars) | 重置页 |
| reset.confirmPasswordPlaceholder | 再输入一次新密码 | Re-enter new password | 重置页 |
| reset.saveNewPassword | 保存新密码 | Save new password | 重置页 |
| reset.doneBody / goSignIn | 新密码设置成功，现在可以用它登录了。 / 去登录 | Your new password is set — you can sign in with it now. / Go to sign in | 重置完成 |

## 6. 与当前 /login 的差异清单

- **删**：Magic Link 入口与相关文案/状态（`magicBackupHint`、`sendMagicLink`、`magicSent*`、`MagicLinkState`）。
- **增**：记住 30 天复选框（默认勾选）；忘记密码链接；忘记密码「请求 / 已发送 / 重置密码页 / 完成」4 态；密码显示/隐藏眼睛切换（`aria-pressed`）；角色 + 眼睛动效层（Ember 一家）；登录/注册标题 + 副标题。
- **改**：Google 明确降为**次按钮（outline）**、置于分隔线「或」之下，邮箱密码为主路径前置；标题改为「欢迎回来 / 创建账号」并加副标题；密码占位按登录/注册区分。
- **留**：暖纸感系统 + 点阵底、闪电品牌标、`ForgeNote` serif 标题、分类副标题、slogan、深橙 `#B5562B` 主按钮、`#FFFDF9`/`#E3D8C7` 暖色表单、`380/350` 宽度、邮箱密码主路径、同页注册切换、失败不泄露账号是否存在、`未配置` 提示（避免白屏）、已登录访问 `/login` 跳 `/forge`。

## 7. 可访问性

- **对比度**：主文字 `#33291F` on `#FBF7F0` ≈ 10:1+；次文字 `#6f6253` on 底 ≈ 4.6:1（正文 AA）；主按钮字 `#FDF7EF` on `#B5562B` ≈ 4.5:1（AA）；错误 `#9E3322` 高对比。**链接 `#B5562B` 在暖底接近 4.5:1 临界——所有链接同时用下划线/加粗，不只靠颜色区分**（切换、忘记密码、显示密码等）。
- **键盘可操作 / 焦点态**：所有 input / button / 链接（用 `<button>` 或 `<a>`）可 Tab 到达；统一 `focus-visible` 3px 暖色 ring（`rgba(181,86,43,.28)`）可见；不隐藏主操作。
- **显示密码切换**：`<button type="button">` + `aria-label`（显示密码/隐藏密码）+ `aria-pressed`（true/false）；图标 `aria-hidden`；切换只改 `input type` 与图标，不移动焦点。
- **动效尊重 prefers-reduced-motion**：全量降级见 §3（关闭跟随/眨眼/跳/晃/过渡，姿态瞬切）；**功能与可读性不依赖动效**——表情仍随状态变化（捂眼/笑/皱眉），只是不补间。
- **其它**：邮箱/密码给 `<label>`（重置页/工作台字段上方 label，登录可占位但关键字段给 label——基线 §5）；表单级错误 `role="alert"`，异步提示卡 `role="status" aria-live="polite"`；移动输入字号 `16` 防 iOS 缩放；触控目标 ≥44；标题 `break-keep`，移动端标题不孤立单个汉字。

## 8. 开放问题 / 给 Codex 或 Owner 的备注

- 角色命名：原型称「Ember 一家」（暖色 spark 家族，呼应闪电品牌标）。是否正式命名/进品牌资产，待 Owner 定；实现上角色是纯装饰 SVG，`aria-hidden` 或给整体一个 `aria-label`。
- 重置流程落地形态：忘记密码「请求/已发送」可在 `/login` 同页态；「设新密码/完成」通常是独立路由（如 `/reset` 或 `/auth/callback` 后的 update-password 页）。需与现有 `/auth/callback` 与 Supabase `resetPasswordForEmail` / `updateUser` 流程对齐——本稿只定视觉与文案，不改认证行为。
- 「记住 30 天」实现：影响 Supabase session/refresh 生命周期（勾选=持久，未勾选=会话级），具体持久化方式由 Claude Code 按 supabase-js 能力确定；UI 默认勾选。
- 失败文案统一为「邮箱或密码不正确」，登录/找回均不区分账号是否存在（沿用 `invalidCredentials` 语气），避免账号枚举。
- 角色资源为内联 SVG（无外部图片/字体），首屏无额外网络请求；如未来要做更精细角色，仍须守「仅 transform/opacity、无首屏自动播放、reduced-motion 全降级」。

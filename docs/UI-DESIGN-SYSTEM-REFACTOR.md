# ForgeNote UI 设计系统统一 + 关键页面精修重构

> 版本：v1.0  
> 目标执行者：Codex  
> 当前任务类型：UI 系统化重构，不新增业务功能  
> 当前主文档依据：`docs/PRD-M2.md`、`docs/UIUX-M2.md`  
> 参考仓库：`joeseesun/qiaomu-design`、`tw93/Kami`、`nexu-io/motion-anything`

---

## 0. 执行结论

当前 ForgeNote 的问题不是单个页面不好看，而是：

1. 没有稳定的设计系统；
2. 页面之间视觉语言不一致；
3. 登录页、落地页、登录后首屏、工作台像不同 Agent 分别生成；
4. 工作台控件粗糙，像 AI 低保真草稿；
5. M2 的“账号驱动 + 内容工作台”没有在界面中稳定表达。

本次重构目标：

> 把 ForgeNote 从“AI 原型稿”提升为一套统一、克制、可长期使用的内容工作台界面。

本次不要做：

- 不新增业务功能；
- 不做复杂动效；
- 不做原子审核；
- 不做关系图；
- 不做知识图谱；
- 不做源创文档里的完整原料池系统；
- 不引入新的 UI 框架；
- 不重写 M2 业务流。

---

## 1. 三个参考仓库的使用边界

### 1.1 qiaomu-design：主参考

`qiaomu-design` 是本次最重要的参考。它定位为让 AI 生成界面停止“AI 味”的 Claude Code Agent Skill，强调反模板化、设计审查、已有页面打磨、中文排版、工程验收。

本次要吸收它的方法，而不是机械复制它的代码。

参考方向：

- 反 AI 味；
- UI 审查；
- 中文排版纪律；
- 设计系统先行；
- 已有页面 polish，而不是推倒重来；
- 先立 `DESIGN.md`，再改页面；
- 每个页面都要能解释“为什么这样设计”。

使用方式：

1. 先做 UI Audit；
2. 再建立 ForgeNote 专属 Design System；
3. 再重构 First-run 与 Workspace；
4. 最后回补 Landing 与 Login 的一致性。

参考：<https://github.com/joeseesun/qiaomu-design>

---

### 1.2 Kami：内容质感参考

`Kami` 的核心主张是“Good content deserves good paper”。它更适合参考“内容落到纸面上”的质感、约束语言和文档式排版，而不是作为 Web App 组件库。

ForgeNote 是内容创作工作台，应吸收 Kami 的这些点：

- 内容应该有纸面感；
- 界面应该安静，不抢内容；
- 排版要像可长期阅读和编辑的内容工具；
- 卡片、正文、派生结果要有“成稿感”；
- 不要做成冷冰冰的企业后台。

使用边界：

适合参考：

- Landing 的产品展示区；
- Login 左侧品牌区；
- First-run 的账号资料输入区；
- Workspace 中区主内容编辑；
- 派生结果 overlay；
- 将来导出类页面。

不适合参考：

- Workspace 四区复杂交互；
- 右侧控制面板；
- 账号记忆状态管理；
- 结构稳定性逻辑。

参考：<https://github.com/tw93/Kami>

---

### 1.3 motion-anything：暂缓实现，只制定微动效边界

`motion-anything` 当前不作为本次主要实现对象。ForgeNote 现在缺的不是动效，而是静态设计系统和界面精度。

本次只制定动效原则，不引入复杂 motion engine。

允许的微动效：

- 按钮 hover / pressed；
- 卡片 hover；
- 选中态过渡；
- Stage 切换轻微 opacity / translate；
- 派生结果 overlay 出现和关闭；
- 右侧面板局部状态更新。

禁止的动效：

- 大面积入场动画；
- 炫技式弹性动画；
- 背景动态粒子；
- 复杂滚动叙事；
- 影响编辑效率的 motion；
- 为了“高级感”而加动画。

参考：<https://github.com/nexu-io/motion-anything>

---

## 2. 当前 UI 问题诊断

### 2.1 Landing

当前问题：

1. 整体完成度相对较高，但像模板站；
2. 首屏过度依赖大标题，产品证据不足；
3. 三张概念卡解释了功能，但没有展示真实工作流；
4. 产品截图像 mockup，不像真实可用的工作台；
5. 落地页与 Workspace 的细节语言不一致。

重构方向：

Landing 不要大改文案结构，重点改：

- 产品截图区；
- 卡片样式；
- 按钮样式；
- 色彩 token；
- 与 Workspace 一致的组件视觉。

核心目标：

> Landing 必须让用户相信：ForgeNote 打开后真的能基于账号给出下一条内容判断。

---

### 2.2 Login

当前问题：

1. 左侧吉祥物面积过大，抢过产品本身；
2. 表单样式和 Landing / Workspace 不统一；
3. 登录按钮颜色偏肉粉，和品牌橙不一致；
4. 登录页像独立设计稿，不像同一套产品系统。

重构方向：

- 保留双栏结构；
- 缩小吉祥物；
- 左侧增加产品能力短句；
- 表单组件使用统一 Input / Button / Card token；
- 登录按钮统一使用 brand 色；
- 整体气质从“可爱插画页”调整为“温暖但专业的内容工具入口”。

---

### 2.3 登录后首屏 / First-run

当前问题最严重。

现在登录后直接显示：

> 把一个模糊想法，变成可以直接开始做的内容方案

这会把 ForgeNote 打回“高级 ChatGPT 输入框”。

M2 的核心不是：

    输入一个想法 → 生成内容

而是：

    账号资料 / 近期内容
    → 账号大脑
    → 选题雷达
    → 结构生成
    → 主内容
    → 平台派生
    → 回填表现

所以 First-run 必须体现账号驱动。

重构方向：

根据账号记忆状态分两种：

1. 无账号记忆：引导建立账号大脑；
2. 已有账号记忆：展示继续任务 + 选题雷达 + 新建内容。

---

### 2.4 Workspace

当前问题：

1. 四区结构已经有了，但像低保真 wireframe；
2. 左栏信息太少，大面积空白；
3. 中区结构块太粗，只有“钩子 / 洞察 / 收束”，没有内容依据；
4. 右栏出现 internal field name，例如 `context.granularity`；
5. 底部栏主操作不随阶段变化；
6. “助手”胶囊悬浮位置奇怪，破坏工作流；
7. 控件、卡片、输入框、标签的间距、圆角、颜色不统一。

重构方向：

- 保留四区结构；
- 精修信息层级；
- 右侧面板全部改成人类语言；
- 中区结构块增加“内容 + 依据 + 可编辑策略”；
- 底部栏根据当前阶段切换主操作；
- 移除或重新定位助手胶囊；
- 统一设计 token。

---

## 3. ForgeNote 设计原则

### 3.1 产品气质

ForgeNote 是：

    内容结构生成系统 + 单任务创作工作台

不是：

    企业后台
    AI 聊天框
    知识图谱工具
    Notion 仿品
    营销模板站

界面关键词：

- 内容工作台；
- 温暖纸感；
- 克制；
- 可长期编辑；
- 精密但不冷；
- 专业但不企业后台；
- 有结构感，但不暴露技术复杂度。

---

### 3.2 M2 UI 原则

1. **账号驱动优先**  
   界面要先体现账号判断，而不是只给一个空输入框。

2. **中区可读可编辑**  
   Workspace 中区展示人类可读内容，不展示 raw token / JSON。

3. **结构幕后化**  
   结构是引擎，不是用户要学习的术语系统。

4. **控制面板人话化**  
   右栏不允许出现 internal field name。

5. **内容纸面感**  
   中区内容应该像正在被锻造的稿件，而不是调试输出。

6. **阶段主操作明确**  
   用户每一阶段只需要知道下一步该做什么。

7. **不炫技**  
   视觉细节服务于内容生产效率，不服务于展示设计能力。

---

## 4. Design Tokens

请在全局样式中统一建立以下 token。优先使用 CSS variables，并映射到 Tailwind theme。

    :root {
      /* Background */
      --bg-app: #F6F1E8;
      --bg-panel: #FBF8F2;
      --bg-card: #FFFDF8;
      --bg-elevated: #FFFFFF;

      /* Text */
      --text-primary: #2A241D;
      --text-secondary: #6F675E;
      --text-muted: #A39A8F;
      --text-inverse: #FFFDF8;

      /* Border */
      --border-subtle: #E5DCCF;
      --border-strong: #D6C8B8;

      /* Brand */
      --brand: #E85D1F;
      --brand-hover: #D94F16;
      --brand-soft: #FFF0E8;
      --brand-muted: #F6B08F;

      /* State */
      --success: #4F8A5B;
      --success-soft: #EDF6EF;
      --warning: #D8942C;
      --warning-soft: #FFF6E6;
      --danger: #C94A3A;
      --danger-soft: #FFF0EE;

      /* Shadow */
      --shadow-card: 0 1px 2px rgba(42, 36, 29, 0.04), 0 8px 24px rgba(42, 36, 29, 0.06);
      --shadow-popover: 0 12px 40px rgba(42, 36, 29, 0.12);

      /* Radius */
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 14px;
      --radius-xl: 20px;
    }

### 4.1 颜色使用规则

Brand 橙色只用于：

- 主按钮；
- 当前进度；
- 关键状态；
- 选中态；
- 少量品牌图标。

禁止：

- 所有标签都用橙色；
- 同时混用肉粉、亮橙、深橙；
- 每个页面单独写任意色值；
- 用大面积橙色背景。

---

## 5. 字体系统

### 5.1 字体策略

Landing 可使用较强的标题字体气质。  
Workspace 应以系统无衬线为主，保证编辑效率。

推荐：

    --font-sans: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
    --font-serif: "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", serif;
    --font-mono: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;

### 5.2 字号层级

    Display / Landing Hero:
    44-56px / serif / 600 / line-height 1.16

    Page Title:
    32-40px / serif or sans / 600 / line-height 1.2

    Section Title:
    20-24px / sans / 600 / line-height 1.35

    Panel Title:
    16-18px / sans / 600 / line-height 1.4

    Card Title:
    15-16px / sans / 600 / line-height 1.45

    Body:
    14-15px / sans / 400 / line-height 1.7

    Helper:
    12-13px / sans / 400 / line-height 1.5

    Button:
    14px / sans / 600

### 5.3 中文排版规则

1. 中文正文行高不低于 `1.65`；
2. 长段落宽度不超过 `720px`；
3. 工作台正文编辑区建议宽度 `680-760px`；
4. 不要把正文挤在小卡片中；
5. 标签文案不超过 8 个中文字；
6. 按钮文案优先动词开头；
7. 禁止字段名、变量名直接出现在用户界面。

---

## 6. 组件规格

### 6.1 Button

#### Primary Button

    height: 40px / 44px
    padding: 0 18px
    border-radius: 10px
    background: var(--brand)
    hover: var(--brand-hover)
    color: var(--text-inverse)
    font-size: 14px
    font-weight: 600

使用场景：

- 生成账号大脑；
- 生成结构；
- 生成主内容；
- 派生到平台；
- 免费开始。

#### Secondary Button

    background: var(--bg-card)
    border: 1px solid var(--border-subtle)
    color: var(--text-primary)
    hover background: var(--brand-soft)

使用场景：

- 查看怎么运作；
- 跳过；
- 保存结构；
- 切换平台。

#### Disabled Button

    opacity: 0.45
    cursor: not-allowed
    background 不改变布局

---

### 6.2 Card

    background: var(--bg-card)
    border: 1px solid var(--border-subtle)
    border-radius: var(--radius-lg)
    padding: 16px
    box-shadow: var(--shadow-card)

卡片不应过度依赖阴影。  
层级主要靠间距、边框、标题、状态区分。

---

### 6.3 Input / Textarea

    background: var(--bg-card)
    border: 1px solid var(--border-strong)
    border-radius: var(--radius-md)
    padding: 12px 14px
    font-size: 14px / 15px
    line-height: 1.6
    placeholder: var(--text-muted)
    focus border: var(--brand)
    focus ring: 0 0 0 3px var(--brand-soft)

Textarea 规则：

    min-height:
    - First-run account intake: 180px
    - Workspace idea input: 120px
    - Main content section: auto / 120px 起

    最大宽度:
    - First-run: 760px
    - Workspace center: 760px

---

### 6.4 Badge

    height: 24px
    padding: 0 8px
    border-radius: 999px
    font-size: 12px
    font-weight: 500

Badge 类型：

    Default:
    background: var(--bg-card)
    border: var(--border-subtle)
    color: var(--text-secondary)

    Active:
    background: var(--brand-soft)
    color: var(--brand)

    Stable:
    background: var(--success-soft)
    color: var(--success)

    Warning:
    background: var(--warning-soft)
    color: var(--warning)

禁止所有 badge 默认用橙色。

---

### 6.5 Panel

    background: var(--bg-panel)
    border-color: var(--border-subtle)
    padding: 16px

Panel 分三类：

1. Left Panel：导航 + 当前状态；
2. Right Panel：内容设置 + 账号记忆；
3. Bottom Bar：阶段主操作。

---

## 7. 页面重构规格

---

# 7.1 Landing Page

## 目标

Landing 要表达：

> ForgeNote 不是“AI 帮你写内容”，而是基于账号判断下一条内容该怎么做。

## 保留

可以保留当前主标题方向：

    打开 60 秒，它对你账号的判断，
    比空白 ChatGPT 深一个量级

可以保留当前 warm paper 背景。

## 必改

### 7.1.1 首屏结构

建议结构：

    Top Nav

    Hero Eyebrow:
    内容结构生成系统

    Hero Title:
    打开 60 秒，它对你账号的判断，
    比空白 ChatGPT 深一个量级

    Subtitle:
    不是“AI 帮你写内容”。ForgeNote 基于你的账号告诉你：
    下一条做什么、为什么会成、发在哪儿。

    CTA:
    [免费开始] [看看怎么运作]

    Trust note:
    公测阶段 · 注册即用 · 无需信用卡

    Product Proof Strip:
    账号大脑 → 选题雷达 → 结构生成 → 平台派生

### 7.1.2 产品展示区

当前 mockup 要换成更真实的 Workspace 片段。

展示内容建议：

左侧：

    账号：独居生活指南
    账号判断：
    - 受众：第一次独居 / 正在搬家 / 一人生活
    - 有效模式：经验复盘 + 清单指南
    - 避免：泛泛鸡汤 / 太像课程

中区：

    本周推荐选题：
    1. 一个人住，厨房失控往往不是不会做饭
    2. 租房第一年，我终于搞懂 5 笔固定支出
    3. 下班回家 20 分钟，一个人也不将就

右侧：

    结构生成：
    钩子 → 洞察 → 可执行守则 → 平台派生

底部：

    小红书 / X thread / 图片 Prompt

### 7.1.3 三张能力卡

保留三卡，但统一成：

    账号大脑
    粘贴账号资料和近期内容，生成可编辑的账号判断。

    选题雷达
    每周给你几条带依据的选题，不再从空白开始。

    结构生成
    不是直接写成文，而是先生成可修改、可派生的内容结构。

### 7.1.4 Landing 验收

- Hero 与 Workspace 气质一致；
- 产品截图不再像临时 mockup；
- 所有卡片使用统一 Card；
- CTA 使用统一 Button；
- 不出现过度模板化的三等分 SaaS 卡片感；
- 页面看起来属于 ForgeNote，而不是任意 AI 工具官网。

---

# 7.2 Login Page

## 目标

Login 是产品入口，不是单独的插画展示页。  
它应该延续 Landing 的纸感和工作台气质。

## 布局

保留双栏：

    左侧：品牌区
    右侧：登录表单

## 左侧品牌区

当前吉祥物过大，需缩小。

建议内容：

    ForgeNote

    内容结构生成系统
    不是从空白开始，而是从你的账号判断开始。

    能力短句：
    - 账号大脑
    - 选题雷达
    - 结构生成

    小型品牌插画 / 吉祥物

要求：

- 吉祥物不超过左侧高度的 40%；
- 不要让插画成为唯一信息；
- 左侧背景使用 `--bg-panel` 或轻微 warm card；
- Logo、标题、说明与 Landing 一致。

## 右侧表单

表单标题：

    欢迎回来
    继续锻造你的内容

输入框：

    邮箱
    密码

操作：

    保持 30 天登录
    忘记密码？
    [登录]
    或
    [使用 Google 登录]
    还没有账号？创建账号

样式要求：

- Login button 使用 `--brand`；
- Google button 使用 Secondary；
- 输入框使用统一 Input；
- 整体卡片边框使用 `--border-subtle`；
- 不使用肉粉色按钮。

## Login 验收

- 与 Landing / Workspace 使用同一套 token；
- 左侧不再只有大插画；
- 表单控件精细；
- 页面不显得像独立模板；
- 登录按钮和品牌主按钮一致。

---

# 7.3 First-run / 登录后首屏

## 目标

这是本次 P0。  
当前“模糊想法输入框”必须改掉，否则产品定位会错。

First-run 要表达：

> ForgeNote 先理解账号，再生成内容判断。

---

## 7.3.1 无账号记忆状态

触发条件：

    account memory 不存在
    或 account memory 为空
    或用户首次登录

页面标题：

    先建立你的账号大脑

副标题：

    粘贴账号简介和近期内容，ForgeNote 会先判断你适合写什么、哪些表达有效、下一条内容该怎么做。

主输入框 placeholder：

    粘贴你的账号简介、定位、近期 3-5 条内容，或你想继续优化的账号方向……

主按钮：

    生成账号大脑

次按钮：

    跳过，直接写一个想法

下方三张说明卡：

    账号定位
    识别你的受众、主题边界和表达风格。

    有效模式
    总结哪些内容更值得继续，哪些表达容易跑偏。

    下次建议
    给出选题、结构和平台方向，不再从空白开始。

布局建议：

    居中单列
    最大宽度 860px
    顶部留白 96px
    输入区宽度 760px
    说明卡三列，间距 16px

---

## 7.3.2 已有账号记忆状态

触发条件：

    account memory 已存在

页面标题：

    今天继续做哪一条？

副标题：

    基于你的账号大脑，继续上次内容，或从本周选题开始。

中区布局：

    [继续上次内容]
    标题 / 阶段 / 上次编辑时间 / 主按钮：继续编辑

    [本周选题雷达]
    3 张选题卡
    每张显示：
    - 选题标题
    - 推荐原型
    - 为什么适合这个账号
    - 推荐平台
    - 按钮：用这条生成结构

    [新建内容]
    一个轻输入框：
    写一个新想法，ForgeNote 会结合账号大脑生成结构。

侧边摘要：

    账号大脑摘要
    - 受众
    - 语气
    - 可复用结构
    - 避免事项

## First-run 验收

- 无账号记忆时，不再直接显示“模糊想法 → 内容方案”；
- 首屏明确体现 Account Intake；
- 有账号记忆时，显示继续任务和选题雷达；
- 页面不空；
- 页面不是 ChatGPT 输入框变体；
- CTA 明确。

---

# 7.4 Workspace

## 目标

Workspace 是 ForgeNote 的真实产品感来源。  
本次重点精修它。

保留四区：

    Top Bar
    Left Panel
    Center Area
    Right Panel
    Bottom Bar

---

## 7.4.1 Top Bar

当前 Top Bar 可保留，但要精修层级。

建议结构：

    [Home Icon] [Sidebar Toggle]  新内容 · 当前内容标题

规则：

- 当前内容标题最多一行；
- 超出省略；
- 不要过多图标；
- Top Bar 高度固定 56px；
- border-bottom 使用 `--border-subtle`。

---

## 7.4.2 Left Panel

当前左栏太空，必须增加有效状态信息。

结构改为：

    [+ 新建内容]

    当前账号
    - 独居生活指南
    - 小红书
    - 账号大脑：已建立 / 待完善

    当前内容
    - 标题
    - 内容原型
    - 阶段进度
    - 稳定性状态

    本周选题
    - 选题 1
    - 选题 2
    - 选题 3
    [去选题雷达]

    最近内容
    - 最近 3-5 条

### 当前账号卡

示例：

    当前账号
    独居生活指南
    小红书 · 账号大脑已建立

状态 badge：

    账号大脑已建立
    待补充近期内容
    暂无账号记忆

### 当前内容卡

示例：

    把一个模糊想法，变成可以直接开始做的内容方案

    清单指南 · 叙事
    进度 2/3
    结构稳定

进度条使用 brand，但高度保持 4px。

### 本周选题

每条显示一行标题即可：

    厨房失控不是不会做饭
    租房第一年固定支出
    下班 20 分钟不将就

点击后进入 `/workspace?idea=xxx`。

### Left Panel 验收

- 不再大面积空白；
- 左栏能看出账号、内容、阶段；
- 不只是导航，而是工作流状态区；
- 所有卡片使用统一 Card / Panel token。

---

## 7.4.3 Center Area

Center 是主工作区。  
分三个阶段：

    Stage 0：想法输入
    Stage A：结构提纲
    Stage B：主内容编辑

---

### Stage 0：想法输入

标题：

    把一个想法，变成可以开始做的内容方案

副标题：

    ForgeNote 会结合账号大脑，先生成结构，再生成可编辑主内容，最后派生到平台。

输入框 placeholder：

    例如：上线前一晚，我把做了三周的功能砍掉了……

主按钮：

    生成结构

如果没有账号记忆，显示提示：

    还没有账号大脑。你可以先生成结构，但建议先补充账号资料，结果会更准。
    [去建立账号大脑]

---

### Stage A：结构提纲

当前 Stage A 太粗，必须改成“内容方案感”。

顶部：

    内容方向
    清单指南 · 叙事

说明：

    这是这条内容的可读提纲。方向 OK 就生成主内容，之后可以继续编辑。

每个结构块格式：

    [序号] [Slot 名称]
    Strategy 名称

    一句可读内容

    为什么这样写：
    一句解释，说明它如何服务账号、受众或平台。

示例：

    1 钩子
    问题钩子

    一个人住，厨房失控往往不是不会做饭，而是没有固定补货节奏。

    为什么这样写：
    从真实生活阻力切入，比技巧标题更容易被独居用户代入。

    2 洞察
    场景洞察

    真正难的不是做一顿饭，而是让买菜、备菜、吃完这件事可持续。

    为什么这样写：
    把问题从“做饭能力”转成“生活系统”，更符合账号的长期定位。

    3 收束
    可复用守则

    先固定三天一轮的补货节奏，再谈菜谱和厨具。

    为什么这样写：
    给用户一个能马上执行的结论，适合派生成小红书清单。

按钮：

    生成主内容

### Stage A 交互

- Hover 中区结构块，对应右栏 slot 高亮；
- 点击结构块，右栏显示该 slot 的策略选择；
- 如果有待裁决项，结构块右上角显示 warning badge；
- 结构稳定时显示 `结构稳定`；
- 结构不稳定时显示 `还差一步`。

---

### Stage B：主内容编辑

中区显示主内容 sections。

每段结构：

    [heading input]

    [text textarea]

每段底部可显示轻提示：

    来自：钩子 / 洞察 / 收束

右侧 slot hover 联动保留。

编辑规则：

- 用户编辑后的 sections 是后续 derive 的唯一来源；
- 派生不能基于旧结构直接生成；
- 输入框高度应适合长文编辑；
- 正文区域应有纸面感，不像表单。

### Stage B 示例

    标题：
    一个人住，厨房不是被做饭毁掉的

    正文：
    很多人以为一个人住做饭难，是因为不会做菜。
    但真正让厨房失控的，往往不是菜谱，而是节奏。
    ……

---

## 7.4.4 Right Panel

右侧面板必须从“调试面板”改成“内容设置”。

禁止出现：

    context.granularity
    slotKey
    strategyKey
    raw token
    JSON
    blocker
    renderer
    modality stack

全部改成人类语言。

### Right Panel 结构

    内容设置

    结构状态
    - 结构稳定 / 还差一步

    内容原型
    - 清单指南 · 叙事

    结构顺序
    1. 钩子：问题钩子
    2. 洞察：场景洞察
    3. 收束：可复用守则

    待确认
    - 内容详细程度
      [默认] [更具体的步骤]

    输出语言
    [中文] [English] [English · Instagram] [English · LinkedIn]
    [自定义输入]

    账号记忆
    - 受众
    - 语气
    - 已验证模式
    - 避免

### 待确认项文案

不要写：

    context.granularity

改成：

    内容详细程度

不要写：

    blocker

改成：

    还差一步

不要写：

    default value

改成：

    默认

### Right Panel 验收

- 不出现 internal field name；
- 用户不用懂技术也能理解；
- 右栏不是堆配置，而是帮助用户调整内容；
- 与中区 hover 联动；
- 视觉层级比当前更清楚。

---

## 7.4.5 Bottom Bar

当前 Bottom Bar 主按钮逻辑混乱，必须按阶段变化。

### Stage A：结构阶段

    左侧：
    [保存结构]

    中间：
    平台选择器 disabled
    小红书 / X / 图片 Prompt

    右侧：
    [生成主内容]

说明：

    先生成主内容，再派生到平台。

### Stage B：主内容阶段

    左侧：
    [保存为配方]

    中间：
    平台选择器 enabled
    小红书 / X / 图片 Prompt

    右侧：
    [派生到小红书]

### 派生结果状态

派生完成后：

    [复制结果]
    [保存派生]
    [继续编辑主内容]

### Bottom Bar 验收

- 不在主内容生成前显示“派生到小红书”为主按钮；
- 当前阶段的主按钮唯一明确；
- Disabled 状态清楚；
- Bottom Bar 不像拼上去的临时控件。

---

## 7.4.6 Assistant Capsule

当前中下方“助手”胶囊先移除。

如果保留，必须改为右下角：

    Ask ForgeNote

规则：

- 不遮挡主工作区；
- 不抢主操作；
- 不在本次新增复杂聊天功能；
- 可以只作为 disabled / coming later 状态。

本次推荐：移除。

---

## 8. Motion 微动效规范

本次只做轻微动效，不引入新 motion 引擎。

### 允许

    transition duration: 120-180ms
    easing: ease-out
    hover: background / border / shadow subtle
    selected: background + border
    overlay: opacity + translateY(4px)
    stage switch: opacity + translateY(6px)

### 禁止

    大幅缩放
    弹跳
    复杂 stagger
    背景动效
    粒子
    视差
    滚动叙事

### 推荐实现

用 Tailwind transition 或 CSS transition 即可。

    .ui-transition {
      transition:
        background-color 160ms ease-out,
        border-color 160ms ease-out,
        box-shadow 160ms ease-out,
        transform 160ms ease-out,
        opacity 160ms ease-out;
    }

---

## 9. 文件级执行建议

Codex 需要先检查实际项目结构，再决定具体文件。  
但建议按以下顺序执行。

### Step 1：建立设计系统文档

新增：

    docs/DESIGN.md

内容包括：

- 品牌气质；
- design tokens；
- typography；
- spacing；
- component specs；
- page rules；
- 禁用项；
- 验收标准。

### Step 2：全局 token

可能涉及：

    src/app/globals.css
    tailwind.config.ts
    src/styles/*

目标：

- 建立 CSS variables；
- 映射 Tailwind；
- 清理散落色值；
- 不破坏现有 shadcn 样式。

### Step 3：基础组件统一

可能涉及：

    src/components/ui/button.tsx
    src/components/ui/card.tsx
    src/components/ui/input.tsx
    src/components/ui/textarea.tsx
    src/components/ui/badge.tsx

如果项目已有 shadcn 组件，不要重写组件 API，只统一 className / variant。

### Step 4：First-run 重构

可能涉及：

    src/app/first-run/page.tsx
    src/components/first-run/*
    src/lib/account/*

要求：

- 无账号记忆状态；
- 已有账号记忆状态；
- 跳过进入 Workspace；
- 不新增后端能力，缺数据可用现有 mock / fallback。

### Step 5：Workspace 精修

可能涉及：

    src/app/workspace/page.tsx
    src/components/workspace/*
    src/lib/structure/*
    src/lib/content/*

重点：

- Left Panel；
- Center Stage A / B；
- Right Panel 文案；
- Bottom Bar 阶段逻辑；
- 移除 Assistant Capsule。

### Step 6：Login 精修

可能涉及：

    src/app/login/page.tsx
    src/components/auth/*

目标：

- 双栏保留；
- 左侧品牌区增强；
- 表单 token 统一；
- 主按钮颜色统一。

### Step 7：Landing 对齐

可能涉及：

    src/app/page.tsx
    src/components/landing/*

目标：

- 更新产品展示区；
- 卡片样式统一；
- CTA 统一；
- 不大改文案。

---

## 10. 禁止项

本次重构禁止：

1. 新增业务功能；
2. 改动数据库 schema；
3. 引入新的 UI 框架；
4. 引入复杂 motion 库；
5. 实现源创里的原子审核；
6. 实现关系图；
7. 实现知识图谱；
8. 实现语音、图片、批量导入；
9. 把 Workspace 做成聊天界面；
10. 把右栏做成开发调试面板；
11. 在用户界面暴露 internal field name；
12. 只改 Landing，不改 Workspace。

---

## 11. 验收标准

完成后必须满足：

### 11.1 视觉一致性

- Landing / Login / First-run / Workspace 看起来属于同一产品；
- 背景、卡片、按钮、输入框、badge 使用统一 token；
- 不再出现散落色值；
- 不再出现肉粉、橙色、米黄、灰色各自漂移。

### 11.2 产品定位

- First-run 明确体现账号驱动；
- Workspace 明确体现内容工作台；
- 页面不是 ChatGPT 输入框变体；
- 结构是幕后引擎，而不是显性知识图谱。

### 11.3 工作台精度

- Left Panel 不再空；
- Center 结构块包含：
  - slot 名称；
  - strategy；
  - 可读内容；
  - 为什么这样写；
- Right Panel 不出现 internal field name；
- Bottom Bar 主按钮随阶段变化；
- Assistant Capsule 已移除或放到右下角且不干扰主流程。

### 11.4 工程质量

必须通过：

    npm run lint
    npm run typecheck
    npm run build

如果项目没有其中某个脚本，请说明实际可用脚本，并运行对应替代命令。

---

## 12. Codex 输出要求

完成后请输出：

    1. 改了哪些文件
    2. 每个页面改了什么
    3. 哪些 design tokens 已落地
    4. 哪些散落色值已清理
    5. 是否仍有 internal field name 出现在 UI
    6. 是否移除了 / 调整了 Assistant Capsule
    7. npm run lint / typecheck / build 结果
    8. 本地如何验收
    9. 还有哪些未完成项

---

## 13. 推荐执行顺序

严格按以下顺序：

    1. 阅读 docs/PRD-M2.md 和 docs/UIUX-M2.md
    2. 阅读本文件
    3. 新增 docs/DESIGN.md
    4. 建立全局 tokens
    5. 统一基础组件
    6. 重构 First-run
    7. 精修 Workspace
    8. 精修 Login
    9. 对齐 Landing
    10. 运行 lint / typecheck / build
    11. 输出变更总结

不要反过来先改 Landing。  
真实产品感来自 Workspace。

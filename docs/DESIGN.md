# ForgeNote Design System

ForgeNote is a warm, restrained content workspace. The interface should feel like a quiet desk for making a post, not an enterprise dashboard and not a generic AI chat box.

## Principles

- Account-driven first: the product starts from account analysis, then moves into ideas, content frames, draft writing, platform versions, and publishing feedback.
- Human language only in UI: code and APIs may keep internal names, but primary UI copy must describe user actions and results.
- Structure stays behind the scenes: users see content frames, writing order, expression choices, and next actions.
- Paper-like content surfaces: the center workspace should feel readable and editable, with calm spacing and low visual noise.
- One primary action per stage: every screen should make the next useful step obvious.

## Tokens

The source tokens live in `src/app/globals.css`. Use semantic CSS variables before raw color values.

```css
--bg-app: #F6F1E8;
--bg-panel: #FBF8F2;
--bg-card: #FFFDF8;
--bg-elevated: #FFFFFF;

--text-primary: #2A241D;
--text-secondary: #6F675E;
--text-muted: #A39A8F;
--text-inverse: #FFFDF8;

--border-subtle: #E5DCCF;
--border-strong: #D6C8B8;

--brand: #E85D1F;
--brand-hover: #D94F16;
--brand-soft: #FFF0E8;
--brand-muted: #F6B08F;

--success: #4F8A5B;
--success-soft: #EDF6EF;
--warning: #D8942C;
--warning-soft: #FFF6E6;
--danger: #C94A3A;
--danger-soft: #FFF0EE;

--shadow-card: 0 1px 2px rgba(42, 36, 29, 0.04), 0 8px 24px rgba(42, 36, 29, 0.06);
--shadow-popover: 0 12px 40px rgba(42, 36, 29, 0.12);

--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 14px;
--radius-xl: 20px;
```

Brand orange is reserved for primary actions, current progress, selected states, and small brand marks. Do not use it for every badge.

## Components

- Button: primary actions use `--brand`; secondary actions use card background and subtle borders; disabled states keep layout stable.
- Card: use `--bg-card`, `--border-subtle`, `--radius-lg`, and `--shadow-card`; avoid nested card stacks.
- Input and Textarea: use `--bg-card`, `--border-strong`, visible labels, and a `--brand-soft` focus ring.
- Badge: default badges are neutral; active, success, warning, and danger states use their matching semantic colors.
- Panel: sidebars and bottom bars use `--bg-panel` with subtle borders. Panels frame workspace regions, not decoration.

## UI Copy

Forbidden as primary UI copy:

- 配方
- 派生
- 雷达
- 账号大脑
- 结构稳定
- 待裁决
- 渲染
- slot
- strategy
- blocker
- context.granularity

Preferred replacements:

| Internal term | UI term |
|---|---|
| 配方 / Recipe | 写法 / 这套写法 |
| 派生 / Derive | 生成平台版本 |
| 选题雷达 | 本周可写选题 / 找选题 |
| 账号大脑 | 账号分析 |
| 结构 / Structure | 内容框架 |
| 结构稳定 | 内容框架已确认 |
| 待裁决 | 待确认 |
| slot | 段落 / 内容环节 |
| strategy | 写法 / 表达方式 |
| Main Content | 正文 |
| Feedback | 发布表现 |

## First-run

The first-run screen is an account analysis entrance, not a generic idea input.

- Title: `先分析你的账号`
- Primary action: `分析我的账号`
- Secondary action: `跳过，直接写一条内容`
- Explain three outcomes: account positioning, effective writing patterns, and next suggestions.
- Keep the existing account intake API and success redirect.

## Workspace

Keep the four-zone workspace and existing generation flow.

- Left panel: new content, current account, current content, weekly ideas, and recent content.
- Center Stage 0: idea input and `生成内容框架`.
- Center Stage A: readable content frame cards with paragraph name, expression choice, draft line, and rationale.
- Center Stage B: editable draft sections.
- Right panel: current state, content type, writing order, items to confirm, output language, account analysis summary.
- Bottom bar: stage-aware primary action, moving from `生成正文` to platform version generation.

Do not expose raw JSON, internal field names, or machine keys in user-facing text.

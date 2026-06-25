// ForgeNote M1 — 固定 mock 生成器（I-02A）。
// 约束：不调用外部 API、不读取环境变量、不生成随机内容、只返回固定 mock。
// 固定示例主题：「第一次独居备用金清单」。
// 依据：docs/MODEL-INTEGRATION.md §5（失败降级）、docs/DATA-SCHEMA.md §4、docs/API-CONTRACT.md §5.1。

import type {
  Assumption,
  CardPromptItem,
  CardStructureItem,
  ContentPackage,
  ForgeGenerationRequest,
  ForgeGenerationResponse,
  Question,
  RecipeDraft,
  Verification,
} from "./types";

/** 输入为空时补的 3 条方向假设。 */
const DEFAULT_ASSUMPTIONS: Assumption[] = [
  {
    key: "audience",
    label: "受众",
    value: "普通家庭财务新手",
    valueType: "text",
    source: "inferred",
    state: "default",
    editable: true,
    rationale: "固定 mock 用通用财务新手作为默认读者。",
    confidence: "inferred",
  },
  {
    key: "content_form",
    label: "内容形式",
    value: "图文清单",
    valueType: "text",
    source: "inferred",
    state: "default",
    editable: true,
    rationale: "备用金主题适合拆成可扫读清单。",
    confidence: "inferred",
  },
  {
    key: "angle",
    label: "表达角度",
    value: "先给判断再给做法",
    valueType: "text",
    source: "inferred",
    state: "default",
    editable: true,
    rationale: "财务建议先给判断，再给执行步骤。",
    confidence: "inferred",
  },
];

/** 固定 7 张卡片结构。 */
const CARD_STRUCTURE: CardStructureItem[] = [
  { index: 1, type: "cover", title: "第一次独居\n先留这笔钱" },
  { index: 2, type: "content", title: "为什么要先留备用金" },
  { index: 3, type: "content", title: "先留多少" },
  { index: 4, type: "content", title: "这笔钱放哪里" },
  { index: 5, type: "content", title: "哪些算紧急支出" },
  { index: 6, type: "content", title: "怎么慢慢攒" },
  { index: 7, type: "ending", title: "先有底，再谈生活" },
];

/** 固定 7 张卡片的逐页文案与配图方向。 */
const CARD_PROMPTS: CardPromptItem[] = [
  {
    index: 1,
    prompt: "第一次独居，先留一笔能让你睡得着的钱。",
    body: "先别急着买齐所有家具。\n真正让独居变稳的，是一笔随时能用的备用金。",
    visualDirection:
      "暖米白背景，深炭黑大标题，低饱和橙色细节点缀，极简留白，无人物。",
  },
  {
    index: 2,
    prompt: "备用金不是为了变有钱，是为了遇到突发事不用慌。",
    body: "家电突然坏了\n临时需要看病\n房租押金周转不开\n这些都不该靠临时借钱解决。",
    visualDirection:
      "三列清单排版，浅灰线稿小图标对应家电、医疗、搬家，文字留白充足。",
  },
  {
    index: 3,
    prompt: "第一次独居，先从 1 个月基础开销开始。",
    body: "如果压力大，先留 1 个月。\n稳定后再慢慢补到 3 个月。\n不用一步到位，先有底最重要。",
    visualDirection:
      "阶梯式数字图示，从 1 个月到 3 个月，数字清晰，背景保持克制。",
  },
  {
    index: 4,
    prompt: "这笔钱不要放在会让你舍不得动的地方。",
    body: "备用金的第一要求是：急用时能拿出来。\n可以单独放一个随取账户，和日常消费分开。",
    visualDirection:
      "左右对比排版：日常花销账户与备用金账户，用细线分隔，配图方向偏账本/钱包抽象图标。",
  },
  {
    index: 5,
    prompt: "这些情况，才值得动用备用金。",
    body: "看病买药\n维修必要家电\n临时搬家或押金周转\n影响生活安全的支出",
    visualDirection:
      "四个勾选项列表，配简单线性图标，重点突出“必要”和“紧急”。",
  },
  {
    index: 6,
    prompt: "攒备用金，最怕靠临时热情。",
    body: "每次收入到账后，先划一小笔。\n哪怕每月只多一点，也比月底剩多少算多少更稳。",
    visualDirection:
      "月历和小额转账箭头组合，低饱和色块，画面温和不施压。",
  },
  {
    index: 7,
    prompt: "先有底，再谈生活。",
    body: "独居不是一下子把生活过完美。\n先让自己有一点余地，后面的选择才会更从容。",
    visualDirection:
      "回到封面同款暖米白背景，中心短句排版，右下角放极简钥匙或小房子线稿。",
  },
];

/**
 * 返回固定 mock 内容包。
 * 不接外部模型，仅用于 I-02A 打通类型与契约。
 */
export function generateMockContentPackage(
  request: ForgeGenerationRequest,
): ForgeGenerationResponse {
  // 规则 1：空输入或纯空白 → 失败（不可重试），保留草稿（D-04）。
  if (request.rawInput.trim().length === 0) {
    return {
      ok: false,
      error: {
        code: "INPUT_EMPTY",
        message: "输入内容不能为空",
        retryable: false,
      },
      draft: {
        rawInput: request.rawInput,
        intentType: request.intentType,
        assumptions: request.assumptions,
        status: "draft",
        outcome: null,
        errorCode: "INPUT_EMPTY",
      },
    };
  }

  // 规则 2：优先回传请求中的 assumptions；为空则补固定默认。
  const assumptions =
    request.assumptions.length > 0 ? request.assumptions : DEFAULT_ASSUMPTIONS;

  // 规则 3：完整 ContentPackage（字段命名对齐 DATA-SCHEMA §4.2）。
  const outcome: ContentPackage = {
    positioning:
      "这组内容帮助第一次独居的人理解：备用金该留多少、放在哪里、怎么慢慢攒，用成熟生活手册的口吻给出可执行的清单。",
    titles: [
      "第一次独居，先留这笔钱",
      "独居第一年，备用金清单收好",
      "搬出来住之前，先把这笔钱留好",
    ],
    body:
      "第一次一个人住，最该先准备的不是好看的家具，而是一笔能让你睡得着的备用金。\n\n它的作用很简单：当家电突然坏了、人不舒服要看病、或者临时需要搬家时，你不用慌，也不用为了几百块为难。\n\n这份清单分四步：先确认要留多少，再决定放在哪里，然后认清哪些算紧急支出，最后用一个小习惯慢慢把它攒起来。先有底，再谈生活。",
    cardStructure: CARD_STRUCTURE,
    cardPrompts: CARD_PROMPTS,
    hashtags: ["独居生活", "第一次独居", "备用金", "一个人住", "生活手册"],
    commentGuide:
      "你第一次独居时，有没有专门留一笔备用金？大概留了多久的开销？",
  };

  // 规则 4：完整 RecipeDraft。
  const recipe: RecipeDraft = {
    name: "成熟生活手册式独居卡片配方",
    intentType: request.intentType,
    audience: "第一次独居的人",
    goal: "把生活经验整理成可收藏、可复用的图文清单",
    tone: "清楚、温和、可收藏，不制造焦虑",
    structure: [
      "内容定位",
      "标题备选",
      "发布正文",
      "卡片结构",
      "画面说明",
      "发布话题",
      "评论区引导",
    ],
    visualStyle: "暖米白背景、深炭黑标题、低饱和橙强调、浅灰线稿、极简留白",
    negativeRules: ["不要广告感", "不要课程感", "不要焦虑营销", "不要引流话术"],
    variables: ["主题", "卡片数量", "目标人群", "核心建议"],
    acceptance: [
      "发布正文能独立成文",
      "逐页卡片文案可直接复制到设计稿",
      "每页都有明确配图方向",
      "没有焦虑营销和引流词",
    ],
  };

  // 规则 5：验收结果（overallPassed + checks，对齐 DATA-SCHEMA §4.4）。
  const verification: Verification = {
    overallPassed: true,
    checks: [
      { key: "has_title", label: "有标题", passed: true, message: "已包含标题备选" },
      { key: "has_body", label: "有正文", passed: true, message: "已包含发布正文" },
      {
        key: "has_card_prompts",
        label: "有逐页卡片文案",
        passed: true,
        message: "已包含 7 页卡片文案",
      },
      {
        key: "card_count",
        label: "逐页卡片数量（5-8）",
        passed: true,
        message: "已规划 7 页",
      },
      {
        key: "cards_aligned",
        label: "卡片标题与文案一一对应",
        passed: true,
        message: "每页都有标题和文案",
      },
      {
        key: "cards_have_copy",
        label: "每页有可复制文案",
        passed: true,
        message: "每页都有正文/要点",
      },
      {
        key: "cards_have_visual_direction",
        label: "每页有配图方向",
        passed: true,
        message: "每页都有配图方向",
      },
      { key: "has_hashtags", label: "有话题", passed: true, message: "已包含发布话题" },
      {
        key: "no_diversion",
        label: "无公众号/微信/私信领取等引流词",
        passed: true,
        message: "mock 文案不含引流词",
      },
    ],
  };

  const questions: Question[] = [];

  return {
    ok: true,
    intentType: request.intentType,
    assumptions,
    questions,
    outcome,
    recipe,
    verification,
  };
}

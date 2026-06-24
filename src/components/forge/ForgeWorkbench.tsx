"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Compass, FilePlus2, Library, Settings2, UserRound } from "lucide-react";

import { DirectionPanel } from "@/components/forge/DirectionPanel";
import { IdeaInput } from "@/components/forge/IdeaInput";
import { OutcomePanel } from "@/components/forge/OutcomePanel";
import { RecipePanel } from "@/components/forge/RecipePanel";
import { Button } from "@/components/ui/button";
import type {
  Assumption,
  ContentPackage,
  Question,
  RecipeDraft,
  Verification,
} from "@/lib/ai/types";
import { copy } from "@/lib/copy";
import { MAX_INPUT_CHARS, MAX_OUTPUT_LOCALE_CHARS } from "@/lib/constants";

/** /api/forge 成功响应中的 data（与 route handler 输出对齐）。 */
export interface ForgeData {
  // Batch A 起：成功生成并落库后返回 sessionId。
  sessionId: string;
  intentType: string;
  assumptions: Assumption[];
  questions: Question[];
  outcome: ContentPackage;
  recipe: RecipeDraft;
  verification: Verification;
}

export type ForgeStatus = "idle" | "review" | "loading" | "success" | "error";

/**
 * 服务端预载的初始 session（I-10：换输入重跑后落到 /forge?session=<id> 查看结果）。
 * completed 且含 outcome → 直接呈现成功结果；draft/失败 → 回填输入并展示错误态供重试。
 */
export interface InitialSession {
  sessionId: string;
  rawInput: string;
  data: ForgeData | null;
  assumptions: Assumption[];
  status: "success" | "error";
  errorMessage: string | null;
  // I-16：预载 session 的目标输出语言 / 表达偏好（可为 null）。
  outputLocale: string | null;
}

interface ForgeWorkbenchProps {
  initialSession?: InitialSession | null;
  /**
   * I-11：当前用户偏好（profile_preferences）映射成的 source="profile" 假设。
   * 由 /forge Server Component 按 RLS 读取后注入；无 session 预载时作为初始假设种子带出。
   * 空数组 = 无偏好 → 行为与之前完全一致。
   */
  initialProfileAssumptions?: Assumption[];
}

type DirectionDefinition = {
  key: "audience" | "content_form" | "angle";
  label: string;
  fallback: string;
  profileKeys: string[];
  profileLabels: string[];
};

type StoredDraft = {
  idea?: string;
  accountPost?: string;
  outputLocale?: string;
};

const DRAFT_STORAGE_KEY = "forgenote.forge.draft.v1";

const DIRECTION_DEFINITIONS: DirectionDefinition[] = [
  {
    key: "audience",
    label: "受众",
    fallback: "普通家庭财务新手",
    profileKeys: ["audience"],
    profileLabels: ["受众", "目标受众"],
  },
  {
    key: "content_form",
    label: "内容形式",
    fallback: "图文清单",
    profileKeys: ["content_form", "output_form", "format", "structure"],
    profileLabels: ["内容形式", "结构方式"],
  },
  {
    key: "angle",
    label: "表达角度",
    fallback: "先给判断再给做法",
    profileKeys: ["angle", "tone", "style"],
    profileLabels: ["表达角度", "语气", "语气风格", "风格"],
  },
];

export function ForgeWorkbench({
  initialSession = null,
  initialProfileAssumptions = [],
}: ForgeWorkbenchProps) {
  const [idea, setIdea] = useState(initialSession?.rawInput ?? "");
  const [accountPost, setAccountPost] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<ForgeStatus>(
    initialSession?.status ?? "idle",
  );
  const [data, setData] = useState<ForgeData | null>(
    initialSession?.data ?? null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialSession?.errorMessage ?? null,
  );
  // 区分 AUTH_REQUIRED 与一般生成失败：前者展示「需要登录」，不跳转登录页。
  const [errorCode, setErrorCode] = useState<string | null>(null);
  // 成功后保存 sessionId（Batch A）。
  const [sessionId, setSessionId] = useState<string | null>(
    initialSession?.sessionId ?? null,
  );
  const [assumptions, setAssumptions] = useState<Assumption[]>(() =>
    initialSession?.assumptions?.length
      ? buildDirectionAssumptions(
          initialSession.rawInput,
          "",
          initialProfileAssumptions,
          initialSession.assumptions,
        )
      : [],
  );
  // I-16：目标输出语言 / 表达偏好（自由文本，可选）。空串提交时归一化为 null。
  const [outputLocale, setOutputLocale] = useState(
    initialSession?.outputLocale ?? "",
  );
  // I-11：「记住为偏好」反馈——已成功保存的假设 key 集合（短暂显示「已记住」）。
  const [rememberedKeys, setRememberedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (initialSession) return;

    const timer = window.setTimeout(() => {
      const draft = readStoredDraft();
      if (!draft) return;
      setIdea(draft.idea ?? "");
      setAccountPost(draft.accountPost ?? "");
      setOutputLocale(draft.outputLocale ?? "");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialSession]);

  useEffect(() => {
    if (initialSession) return;

    const timer = window.setTimeout(() => {
      const hasDraft =
        idea.trim().length > 0 ||
        accountPost.trim().length > 0 ||
        outputLocale.trim().length > 0;

      if (!hasDraft) {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        setSavedAt(null);
        return;
      }

      window.localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          idea,
          accountPost,
          outputLocale,
          updatedAt: new Date().toISOString(),
        }),
      );
      setSavedAt(
        new Intl.DateTimeFormat("zh-Hans-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
      );
    }, 500);

    return () => window.clearTimeout(timer);
  }, [accountPost, idea, initialSession, outputLocale]);

  const hasDirection = assumptions.some((a) => a.state !== "dismissed");
  const authRequired = status === "error" && errorCode === "AUTH_REQUIRED";
  const showResults =
    status === "loading" || status === "success" || status === "error";

  const shellStatus = useMemo(() => {
    if (status === "loading") return copy.shell.generating;
    if (status === "review") return copy.shell.reviewing;
    if (status === "success") return copy.shell.generated;
    if (status === "error") return copy.shell.error;
    return copy.shell.drafting;
  }, [status]);

  function prepareDirection() {
    if (idea.trim().length === 0 || idea.length > MAX_INPUT_CHARS) return;

    setAssumptions(
      buildDirectionAssumptions(
        idea,
        accountPost,
        initialProfileAssumptions,
        assumptions,
      ),
    );
    setData(null);
    setErrorMessage(null);
    setErrorCode(null);
    setSessionId(null);
    setStatus("review");
  }

  async function runForge() {
    const directionAssumptions =
      assumptions.length > 0
        ? assumptions
        : buildDirectionAssumptions(
            idea,
            accountPost,
            initialProfileAssumptions,
            [],
          );

    setAssumptions(directionAssumptions);
    setStatus("loading");
    setErrorMessage(null);
    setErrorCode(null);

    // 只提交未删除的假设；dismissed 不参与生成请求（UIUX §6.4）。
    const submitAssumptions = directionAssumptions.filter(
      (a) => a.state !== "dismissed",
    );

    try {
      const res = await fetch("/api/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawInput: idea,
          assumptions: submitAssumptions,
          // I-16：空串视为不指定（null）；旧行为不受影响。
          outputLocale: outputLocale.trim() || null,
          accountPost: accountPost.trim() || null,
        }),
      });
      const json = await res.json();

      if (json?.ok) {
        const nextData = json.data as ForgeData;
        const nextAssumptions = buildDirectionAssumptions(
          idea,
          accountPost,
          initialProfileAssumptions,
          nextData.assumptions.length > 0
            ? nextData.assumptions
            : directionAssumptions,
        );

        setData({ ...nextData, assumptions: nextAssumptions });
        setSessionId(nextData.sessionId ?? null);
        setAssumptions(nextAssumptions);
        setStatus("success");
      } else {
        // 失败时保留用户输入（idea 不清空），展示错误并允许重试（UIUX §7.4 / D-04）。
        setErrorMessage(json?.error?.message ?? copy.forge.generateFailed);
        setErrorCode(json?.error?.code ?? null);
        setStatus("error");
      }
    } catch {
      setErrorMessage(copy.common.networkError);
      setErrorCode(null);
      setStatus("error");
    }
  }

  // 「新建」：清空当前 session 回到空态（UIUX §7.5）。
  function handleNew() {
    setIdea("");
    setAccountPost("");
    setData(null);
    setStatus("idle");
    setErrorMessage(null);
    setErrorCode(null);
    setSessionId(null);
    setAssumptions([]);
    setOutputLocale("");
    setRememberedKeys([]);
    setSavedAt(null);
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  }

  // I-11：把一条假设「记住为偏好」——upsert 到 profile_preferences，下次 /forge 自动带出。
  //   intentType 取本次结果（缺省 content_package）。仅写入，不改当前假设工作集。
  async function rememberAssumption(a: Assumption) {
    const intentType = data?.intentType ?? "content_package";
    try {
      const res = await fetch("/api/profile/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentType,
          dimensionKey: a.key,
          dimensionLabel: a.label,
          value: a.value,
        }),
      });
      const json = await res.json().catch(() => null);
      if (json?.ok) {
        setRememberedKeys((prev) =>
          prev.includes(a.key) ? prev : [...prev, a.key],
        );
      }
    } catch {
      // 记住偏好失败不打断主流程；用户可在 /profile 手动添加。
    }
  }

  function editAssumption(key: string, value: string) {
    setAssumptions((prev) =>
      prev.map((a) =>
        a.key === key
          ? {
              ...a,
              value,
              source: "manual",
              state: "edited",
              highlight: true,
              confidence: "high",
              rationale: `你已把「${a.label}」改为「${value}」。`,
            }
          : a,
      ),
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#f2f0e8]">
      <div className="mx-auto grid max-w-7xl gap-5 px-3 py-4 sm:px-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden rounded-lg bg-[#18322f] p-4 text-white shadow-sm lg:block">
          <div className="sticky top-20 space-y-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/55">
                ForgeNote
              </p>
              <p className="mt-2 text-lg font-semibold">内容工作台</p>
            </div>
            <nav className="space-y-1 text-sm">
              <Link
                href="/forge"
                className="flex items-center gap-2 rounded-md bg-white/12 px-3 py-2 font-medium text-white"
              >
                <Compass className="size-4" aria-hidden />
                今天的方案
              </Link>
              <Link
                href="/recipes"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-white/72 transition hover:bg-white/10 hover:text-white"
              >
                <Library className="size-4" aria-hidden />
                配方库
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-white/72 transition hover:bg-white/10 hover:text-white"
              >
                <UserRound className="size-4" aria-hidden />
                偏好
              </Link>
            </nav>
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-stone-300 bg-white/80 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-stone-800">
              <CheckCircle2 className="size-4 text-emerald-700" aria-hidden />
              {shellStatus}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
              {savedAt && <span>{copy.idea.savedAt.replace("{time}", savedAt)}</span>}
              <Button type="button" variant="ghost" size="sm" onClick={handleNew}>
                <FilePlus2 className="size-3.5" aria-hidden />
                {copy.outcome.new}
              </Button>
            </div>
          </div>

          <section className="rounded-lg border border-stone-300 bg-[#fffaf2] p-4 shadow-sm sm:p-6">
            <IdeaInput
              value={idea}
              onChange={setIdea}
              accountPost={accountPost}
              onAccountPostChange={setAccountPost}
              savedAt={savedAt}
              onForge={prepareDirection}
              pending={status === "loading"}
            />

            <details className="mt-5 border-t border-stone-200 pt-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-stone-700 marker:hidden">
                <Settings2 className="size-4" aria-hidden />
                {copy.forge.outputLocaleLabel}
                <span className="font-normal text-stone-500">
                  {copy.common.optionalSuffix}
                </span>
              </summary>
              <input
                id="output-locale"
                type="text"
                value={outputLocale}
                onChange={(event) => setOutputLocale(event.target.value)}
                placeholder={copy.forge.outputLocalePlaceholder}
                maxLength={MAX_OUTPUT_LOCALE_CHARS}
                disabled={status === "loading"}
                className="mt-3 h-9 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none transition-colors placeholder:text-stone-400 focus-visible:border-stone-500 focus-visible:ring-3 focus-visible:ring-stone-300/60 disabled:opacity-60"
              />
            </details>
          </section>

          {hasDirection && (
            <DirectionPanel
              assumptions={assumptions}
              hasAccountPost={accountPost.trim().length > 0}
              onEdit={editAssumption}
              onGenerate={runForge}
              onRemember={rememberAssumption}
              rememberedKeys={rememberedKeys}
              pending={status === "loading"}
            />
          )}

          {showResults && (
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <OutcomePanel
                status={status}
                outcome={data?.outcome ?? null}
                errorMessage={errorMessage}
                authRequired={authRequired}
                sessionId={sessionId}
                outputLocale={
                  status === "success" ? outputLocale.trim() || null : null
                }
                onRetry={runForge}
                onNew={handleNew}
              />
              <RecipePanel
                // 切换 session 时重挂以重置保存态（成功保存反馈不跨 session 残留）。
                key={sessionId ?? "idle"}
                status={status}
                recipe={data?.recipe ?? null}
                verification={data?.verification ?? null}
                sessionId={sessionId}
              />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function buildDirectionAssumptions(
  idea: string,
  accountPost: string,
  profileAssumptions: Assumption[],
  existingAssumptions: Assumption[],
): Assumption[] {
  const hasIdea = idea.trim().length > 0;
  const hasAccountPost = accountPost.trim().length > 0;

  return DIRECTION_DEFINITIONS.map((definition) => {
    const existing = findAssumption(existingAssumptions, definition);
    const profile = findAssumption(profileAssumptions, definition);
    const seed = existing ?? profile;
    const source = seed?.source ?? (profile ? "profile" : "inferred");
    const value = seed?.value ?? definition.fallback;

    return {
      key: definition.key,
      label: definition.label,
      value,
      valueType: "text",
      source,
      state: seed?.state ?? "default",
      editable: true,
      highlight: seed?.highlight,
      rationale:
        seed?.rationale ??
        buildRationale(definition.key, Boolean(profile), hasAccountPost, hasIdea),
      confidence:
        seed?.confidence ??
        (profile ? "high" : hasAccountPost || hasIdea ? "inferred" : "unsure"),
    };
  });
}

function findAssumption(
  assumptions: Assumption[],
  definition: DirectionDefinition,
): Assumption | undefined {
  return assumptions.find((assumption) => {
    const key = assumption.key.toLowerCase();
    return (
      definition.profileKeys.includes(key) ||
      definition.profileLabels.includes(assumption.label)
    );
  });
}

function buildRationale(
  key: DirectionDefinition["key"],
  fromProfile: boolean,
  hasAccountPost: boolean,
  hasIdea: boolean,
): string {
  if (fromProfile) return "来自你保存过的偏好。";
  if (hasAccountPost) return "参考了你贴的过往帖和这次输入。";

  if (key === "audience") {
    return hasIdea
      ? "从这次输入的主题推断目标读者。"
      : "这次输入还没说清读者，先按常见财务新手处理。";
  }
  if (key === "content_form") {
    return "这类题更适合先拆成可扫读的清单。";
  }
  return "财务内容先给判断，再给做法，读者更容易开始行动。";
}

function readStoredDraft(): StoredDraft | null {
  if (typeof window === "undefined") return null;

  const rawDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!rawDraft) return null;

  try {
    return JSON.parse(rawDraft) as StoredDraft;
  } catch {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    return null;
  }
}

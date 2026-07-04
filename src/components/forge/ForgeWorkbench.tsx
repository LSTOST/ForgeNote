"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Compass,
  Eraser,
  Library,
  Settings2,
  UserRound,
} from "lucide-react";

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
const OUTPUT_LOCALE_PRESETS = [
  { value: "zh-Hans", copyKey: "outputLocalePresetZh" },
  { value: "English", copyKey: "outputLocalePresetEn" },
  { value: "English for Instagram carousel", copyKey: "outputLocalePresetInstagram" },
  { value: "English for LinkedIn carousel", copyKey: "outputLocalePresetLinkedIn" },
] as const;

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
  const router = useRouter();
  const directionPanelRef = useRef<HTMLDivElement | null>(null);
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
  const canClearDraft =
    idea.trim().length > 0 ||
    accountPost.trim().length > 0 ||
    outputLocale.trim().length > 0 ||
    status !== "idle" ||
    Boolean(sessionId);

  const shellStatus = useMemo(() => {
    if (status === "loading") return copy.shell.generating;
    if (status === "review") return copy.shell.reviewing;
    if (status === "success") return copy.shell.generated;
    if (status === "error") return copy.shell.error;
    return copy.shell.drafting;
  }, [status]);

  function prepareDirection() {
    if (idea.trim().length === 0 || idea.length > MAX_INPUT_CHARS) return;

    router.replace("/forge", { scroll: false });
    setAssumptions(
      buildDirectionAssumptions(
        idea,
        accountPost,
        initialProfileAssumptions,
        [],
      ),
    );
    setData(null);
    setErrorMessage(null);
    setErrorCode(null);
    setSessionId(null);
    setStatus("review");
    window.setTimeout(() => {
      directionPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
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
        if (nextData.sessionId) {
          router.replace(`/forge?session=${nextData.sessionId}`, {
            scroll: false,
          });
        }
      } else {
        const draftSessionId =
          typeof json?.draft?.sessionId === "string"
            ? json.draft.sessionId
            : null;
        // 失败时保留用户输入（idea 不清空），展示错误并允许重试（UIUX §7.4 / D-04）。
        setErrorMessage(json?.error?.message ?? copy.forge.generateFailed);
        setErrorCode(json?.error?.code ?? null);
        setSessionId(draftSessionId);
        setStatus("error");
        if (draftSessionId) {
          router.replace(`/forge?session=${draftSessionId}`, {
            scroll: false,
          });
        }
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
    router.replace("/forge", { scroll: false });
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

  function dismissAssumption(key: string) {
    setAssumptions((prev) =>
      prev.map((a) =>
        a.key === key ? { ...a, state: "dismissed", highlight: false } : a,
      ),
    );
  }

  function restoreAssumption(key: string) {
    const defaults = buildDirectionAssumptions(
      idea,
      accountPost,
      initialProfileAssumptions,
      [],
    );
    const fallback = defaults.find((a) => a.key === key);

    setAssumptions((prev) =>
      prev.map((a) => (a.key === key && fallback ? fallback : a)),
    );
  }

  // 引导态（S-08 空工作区）：无输入、无 session 时不渲染四区空面板，
  // 只强调当前任务输入 + 主操作「先确认方向」（ia §2 引导态：左/右/底空区不渲染）。
  if (status === "idle" && !sessionId) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#FBF7F0] px-5 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-2xl">
          <section className="rounded-2xl border border-[#E3D8C7] bg-[#FFFDF9] p-6 shadow-[0_1px_10px_rgba(120,90,50,0.05)] sm:p-8">
            <IdeaInput
              value={idea}
              onChange={setIdea}
              accountPost={accountPost}
              onAccountPostChange={setAccountPost}
              savedAt={savedAt}
              onForge={prepareDirection}
              pending={false}
            />
          </section>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1 px-1 text-[13px] leading-6 text-[#6f6253]">
            <span className="font-medium text-[#2A2320]">
              {copy.workspace.guidedFillHint}
            </span>
            <span>{copy.workspace.guidedDims}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#FBF7F0]">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-3 py-4 sm:px-5">
        <div className="flex flex-col gap-3 rounded-xl border border-[#E3D8C7] bg-[#FFFDF9] px-4 py-3 shadow-[0_1px_10px_rgba(120,90,50,0.05)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-[#2A2320]">
            <CheckCircle2 className="size-4 text-[#2F7A4F]" aria-hidden />
            {shellStatus}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6f6253]">
            {savedAt && <span>{copy.idea.savedAt.replace("{time}", savedAt)}</span>}
            {sessionId && (
              <span className="rounded-full bg-[#F1E7D6] px-2 py-1 font-mono text-[11px] text-[#6f6253]">
                {sessionId.slice(0, 8)}
              </span>
            )}
            {canClearDraft && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNew}
                className="text-[#6f6253] hover:bg-[#F1E7D6] hover:text-[#2A2320]"
              >
                <Eraser className="size-3.5" aria-hidden />
                {copy.forge.clearDraft}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[236px_minmax(0,1fr)_356px] xl:items-start xl:gap-4">
          {/* 左：账号上下文 / 导航（桌面四区之一；移动不复制分栏，导航走全局 TopNav） */}
          <aside className="hidden rounded-xl border border-[#E3D8C7] bg-[#FFFDF9] p-4 shadow-[0_1px_10px_rgba(120,90,50,0.05)] xl:col-start-1 xl:row-start-1 xl:row-span-2 xl:block">
            <div className="sticky top-20 space-y-5">
              <div>
                <p className="text-[11px] font-medium tracking-[0.18em] text-[#9a8e7c] uppercase">
                  ForgeNote
                </p>
                <p className="mt-1.5 text-base font-semibold text-[#2A2320]">
                  {copy.workspace.leftBrand}
                </p>
              </div>
              <nav className="space-y-1 text-sm">
                <Link
                  href="/forge"
                  aria-current="page"
                  className="flex items-center gap-2 rounded-lg bg-[#B5562B] px-3 py-2 font-medium text-[#FDF7EF]"
                >
                  <Compass className="size-4" aria-hidden />
                  {copy.workspace.navCurrent}
                </Link>
                <Link
                  href="/recipes"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[#6f6253] transition hover:bg-[#F1E7D6] hover:text-[#2A2320]"
                >
                  <Library className="size-4" aria-hidden />
                  {copy.workspace.navRecipes}
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[#6f6253] transition hover:bg-[#F1E7D6] hover:text-[#2A2320]"
                >
                  <UserRound className="size-4" aria-hidden />
                  {copy.workspace.navProfile}
                </Link>
              </nav>
              <div className="space-y-3 border-t border-[#E3D8C7] pt-4 text-sm text-[#6f6253]">
                <div>
                  <p className="text-[11px] tracking-[0.16em] text-[#9a8e7c] uppercase">
                    {copy.workspace.accountMemoryLabel}
                  </p>
                  <p className="mt-1.5 leading-6">{copy.workspace.accountMemoryBody}</p>
                </div>
                <div>
                  <p className="text-[11px] tracking-[0.16em] text-[#9a8e7c] uppercase">
                    {copy.workspace.contentAssetLabel}
                  </p>
                  <p className="mt-1.5 leading-6">{copy.workspace.contentAssetBody}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* 中上：当前任务输入 */}
          <section className="order-1 min-w-0 xl:order-none xl:col-start-2 xl:row-start-1">
            <section className="rounded-xl border border-[#E3D8C7] bg-[#FFFDF9] p-4 shadow-[0_1px_10px_rgba(120,90,50,0.05)] sm:p-6">
              <IdeaInput
                value={idea}
                onChange={setIdea}
                accountPost={accountPost}
                onAccountPostChange={setAccountPost}
                savedAt={savedAt}
                onForge={prepareDirection}
                pending={status === "loading"}
              />
            </section>
          </section>

          {/* 右上：输出偏好 + I-24 方向假设 chip（控制与判断，非内容主舞台） */}
          <div className="order-2 space-y-4 xl:order-none xl:col-start-3 xl:row-start-1">
            <section className="rounded-xl border border-[#E3D8C7] bg-[#FFFDF9] p-4 shadow-[0_1px_10px_rgba(120,90,50,0.05)]">
              <div className="flex items-center gap-2 text-sm font-medium text-[#2A2320]">
                <Settings2 className="size-4" aria-hidden />
                {copy.forge.outputLocaleLabel}
                <span className="font-normal text-[#9a8e7c]">
                  {copy.common.optionalSuffix}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-6 text-[#6f6253]">
                {copy.forge.outputLocaleHint}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {OUTPUT_LOCALE_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOutputLocale(preset.value)}
                    disabled={status === "loading"}
                    aria-pressed={outputLocale === preset.value}
                    className={
                      outputLocale === preset.value
                        ? "border-[#B5562B] bg-[#F1E7D6] text-[#2A2320] hover:bg-[#eaddc6]"
                        : "border-[#E3D8C7] bg-[#FFFDF9] text-[#6f6253] hover:border-[#B5562B] hover:bg-[#F1E7D6] hover:text-[#2A2320]"
                    }
                  >
                    {copy.forge[preset.copyKey]}
                  </Button>
                ))}
                {outputLocale.trim().length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOutputLocale("")}
                    disabled={status === "loading"}
                    className="text-[#6f6253] hover:bg-[#F1E7D6] hover:text-[#2A2320]"
                  >
                    {copy.forge.outputLocaleClear}
                  </Button>
                )}
              </div>
              <input
                id="output-locale"
                type="text"
                value={outputLocale}
                onChange={(event) => setOutputLocale(event.target.value)}
                placeholder={copy.forge.outputLocalePlaceholder}
                maxLength={MAX_OUTPUT_LOCALE_CHARS}
                disabled={status === "loading"}
                className="mt-3 h-9 w-full rounded-lg border border-[#E3D8C7] bg-[#FFFDF9] px-3 text-sm text-[#2A2320] outline-none transition-colors placeholder:text-[#9a8e7c] focus-visible:border-[#B5562B] focus-visible:ring-3 focus-visible:ring-[#B5562B]/[0.28] disabled:opacity-60"
              />
            </section>

            {hasDirection ? (
              <div ref={directionPanelRef} className="scroll-mt-20">
                <DirectionPanel
                  compact
                  assumptions={assumptions}
                  focusedIdea={idea}
                  hasAccountPost={accountPost.trim().length > 0}
                  onDismiss={dismissAssumption}
                  onEdit={editAssumption}
                  onGenerate={runForge}
                  onRemember={rememberAssumption}
                  onRestore={restoreAssumption}
                  rememberedKeys={rememberedKeys}
                  pending={status === "loading"}
                />
              </div>
            ) : (
              <section className="rounded-xl border border-[#E3D8C7] bg-[#FFFDF9] p-4 text-sm leading-6 text-[#6f6253] shadow-[0_1px_10px_rgba(120,90,50,0.05)]">
                <p className="font-medium text-[#2A2320]">
                  {copy.workspace.directionPlaceholderTitle}
                </p>
                <p className="mt-1">{copy.workspace.directionPlaceholderBody}</p>
              </section>
            )}
          </div>

          {/* 中下：内容方案结果（工作主线） */}
          <section className="order-3 min-w-0 xl:order-none xl:col-start-2 xl:row-start-2">
            {showResults ? (
              <OutcomePanel
                status={status}
                outcome={data?.outcome ?? null}
                errorMessage={errorMessage}
                authRequired={authRequired}
                sessionId={sessionId}
                outputLocale={
                  status === "success" ? outputLocale.trim() || null : null
                }
                verification={data?.verification ?? null}
                onRetry={runForge}
                onNew={handleNew}
              />
            ) : (
              <section className="rounded-xl border border-dashed border-[#E3D8C7] bg-[#FBF7F0] p-5 text-sm leading-6 text-[#6f6253]">
                <div className="flex items-start gap-3">
                  <BookOpen className="mt-0.5 size-4 text-[#9a8e7c]" aria-hidden />
                  <div>
                    <p className="font-medium text-[#2A2320]">
                      {copy.workspace.outcomePlaceholderTitle}
                    </p>
                    <p className="mt-1">{copy.workspace.outcomePlaceholderBody}</p>
                  </div>
                </div>
              </section>
            )}
          </section>

          {/* 右下：保存配方（生成后出现） */}
          {showResults && (
            <div className="order-4 xl:order-none xl:col-start-3 xl:row-start-2">
              <RecipePanel
                // 切换 session 时重挂以重置保存态（成功保存反馈不跨 session 残留）。
                key={sessionId ?? "idle"}
                status={status}
                recipe={data?.recipe ?? null}
                verification={data?.verification ?? null}
                sessionId={sessionId}
              />
            </div>
          )}
        </div>

        {/* 底：本次 session / 复用 / 表现连续性 */}
        <section className="grid gap-3 rounded-xl border border-[#E3D8C7] bg-[#FFFDF9] px-4 py-3 text-sm text-[#6f6253] shadow-[0_1px_10px_rgba(120,90,50,0.05)] md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-[#9a8e7c]" aria-hidden />
            <span className="font-medium text-[#2A2320]">
              {copy.workspace.versionLabel}
            </span>
            <span>
              {sessionId
                ? copy.workspace.versionActive.replace("{id}", sessionId.slice(0, 8))
                : copy.workspace.versionIdle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Library className="size-4 text-[#9a8e7c]" aria-hidden />
            <span className="font-medium text-[#2A2320]">
              {copy.workspace.reuseLabel}
            </span>
            <span>
              {data?.recipe
                ? copy.workspace.reuseActive
                : copy.workspace.reuseIdle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#9a8e7c]" aria-hidden />
            <span className="font-medium text-[#2A2320]">
              {copy.workspace.performanceLabel}
            </span>
            <span>
              {status === "success"
                ? copy.workspace.performanceActive
                : copy.workspace.performanceIdle}
            </span>
          </div>
        </section>
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
    const value =
      seed?.value ??
      buildIdeaAwareFallback(definition.key, idea) ??
      definition.fallback;

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

function buildIdeaAwareFallback(
  key: DirectionDefinition["key"],
  idea: string,
): string | null {
  const topic = summarizeIdea(idea);
  if (!topic) return null;

  if (key === "audience") {
    return `对「${topic}」有现实需求的读者`;
  }
  if (key === "content_form") {
    return `围绕「${topic}」的图文清单`;
  }
  return `先回应「${topic}」的具体困惑，再给可执行做法`;
}

function summarizeIdea(idea: string): string {
  const normalized = idea.trim().replace(/\s+/g, " ");
  if (normalized.length <= 18) return normalized;
  return `${normalized.slice(0, 18)}…`;
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
      : "这次输入还没说清读者，先按常见创作者场景处理。";
  }
  if (key === "content_form") {
    return "先拆成可扫读的图文结构，用户更容易判断能不能继续做。";
  }
  return "先回应具体困惑，再给做法，读者更容易开始行动。";
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

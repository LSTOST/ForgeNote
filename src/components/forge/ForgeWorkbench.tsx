"use client";

import { useState } from "react";

import { AssumptionPanel } from "@/components/forge/AssumptionPanel";
import { ExampleIdeas } from "@/components/forge/ExampleIdeas";
import { IdeaInput } from "@/components/forge/IdeaInput";
import { OutcomePanel } from "@/components/forge/OutcomePanel";
import { RecipePanel } from "@/components/forge/RecipePanel";
import type {
  Assumption,
  ContentPackage,
  Question,
  RecipeDraft,
  Verification,
} from "@/lib/ai/types";
import { MAX_OUTPUT_LOCALE_CHARS } from "@/lib/constants";

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

export type ForgeStatus = "idle" | "loading" | "success" | "error";

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

/**
 * 默认假设种子（UIUX §6.1 示例维度）。Batch C 最小实现：
 * 引擎（I-02B 边界）不做智能推断、只回传输入假设，故首次成功后在客户端注入这组可编辑默认假设，
 * 供用户编辑 / 删除 / 恢复，并在重新生成时提交。source=inferred、state=default、editable=true。
 * 不接 profile_preferences、不做偏好记忆、不发起新的模型推断调用。
 */
const DEFAULT_ASSUMPTIONS: Assumption[] = [
  { key: "platform", label: "平台", value: "小红书", valueType: "text", source: "inferred", state: "default", editable: true },
  { key: "output_form", label: "内容形式", value: "7 张卡片", valueType: "text", source: "inferred", state: "default", editable: true },
  { key: "audience", label: "受众", value: "第一次独居的人", valueType: "text", source: "inferred", state: "default", editable: true },
  { key: "tone", label: "语气", value: "成熟、清楚、不焦虑", valueType: "text", source: "inferred", state: "default", editable: true },
];

export function ForgeWorkbench({
  initialSession = null,
  initialProfileAssumptions = [],
}: ForgeWorkbenchProps) {
  const [idea, setIdea] = useState(initialSession?.rawInput ?? "");
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
  // 假设条工作集（Batch C）：客户端为唯一真相，保留 dismissed 以便恢复。
  // I-11：无 session 预载时，用偏好（source="profile"）作为初始假设种子带出；预载 session 用其自身假设。
  const [assumptions, setAssumptions] = useState<Assumption[]>(
    initialSession?.assumptions ?? initialProfileAssumptions.map((a) => ({ ...a })),
  );
  // I-16：目标输出语言 / 表达偏好（自由文本，可选）。空串提交时归一化为 null。
  const [outputLocale, setOutputLocale] = useState(
    initialSession?.outputLocale ?? "",
  );
  // I-11：「记住为偏好」反馈——已成功保存的假设 key 集合（短暂显示「已记住」）。
  const [rememberedKeys, setRememberedKeys] = useState<string[]>([]);

  async function runForge() {
    setStatus("loading");
    setErrorMessage(null);
    setErrorCode(null);

    // 只提交未删除的假设；dismissed 不参与生成请求（UIUX §6.4）。
    const submitAssumptions = assumptions.filter((a) => a.state !== "dismissed");

    try {
      const res = await fetch("/api/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawInput: idea,
          assumptions: submitAssumptions,
          // I-16：空串视为不指定（null）；旧行为不受影响。
          outputLocale: outputLocale.trim() || null,
        }),
      });
      const json = await res.json();

      if (json?.ok) {
        setData(json.data as ForgeData);
        setSessionId(json.data?.sessionId ?? null);
        // 首次成功且尚无假设时注入默认种子，供用户编辑后再次生成。
        setAssumptions((prev) =>
          prev.length > 0 ? prev : DEFAULT_ASSUMPTIONS.map((a) => ({ ...a })),
        );
        setStatus("success");
      } else {
        // 失败时保留用户输入（idea 不清空），展示错误并允许重试（UIUX §7.4 / D-04）。
        setErrorMessage(json?.error?.message ?? "生成失败，请重试");
        setErrorCode(json?.error?.code ?? null);
        setStatus("error");
      }
    } catch {
      setErrorMessage("网络异常，请稍后重试");
      setErrorCode(null);
      setStatus("error");
    }
  }

  // 「新建」：清空当前 session 回到空态（UIUX §7.5）。
  function handleNew() {
    setIdea("");
    setData(null);
    setStatus("idle");
    setErrorMessage(null);
    setErrorCode(null);
    setSessionId(null);
    // 「新建」回到偏好种子（与首次进入一致）；无偏好则空。
    setAssumptions(initialProfileAssumptions.map((a) => ({ ...a })));
    setOutputLocale("");
    setRememberedKeys([]);
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
      // 记住偏好失败不打断主流程（无 toast 库）；用户可在 /profile 手动添加。
    }
  }

  // 假设条状态机：编辑 / 删除 / 恢复 / 全部恢复（UIUX §6.3 / §6.4）。
  function editAssumption(key: string, value: string) {
    setAssumptions((prev) =>
      prev.map((a) =>
        a.key === key ? { ...a, value, state: "edited", highlight: true } : a,
      ),
    );
  }

  function dismissAssumption(key: string) {
    setAssumptions((prev) =>
      prev.map((a) => (a.key === key ? { ...a, state: "dismissed" } : a)),
    );
  }

  function restoreAssumption(key: string) {
    // 恢复到删除前的状态：编辑过的回到 edited，否则 default（highlight 记录是否编辑过）。
    setAssumptions((prev) =>
      prev.map((a) =>
        a.key === key
          ? { ...a, state: a.highlight ? "edited" : "default" }
          : a,
      ),
    );
  }

  function restoreAllAssumptions() {
    setAssumptions((prev) =>
      prev.map((a) =>
        a.state === "dismissed"
          ? { ...a, state: a.highlight ? "edited" : "default" }
          : a,
      ),
    );
  }

  const authRequired = status === "error" && errorCode === "AUTH_REQUIRED";

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <IdeaInput
          value={idea}
          onChange={setIdea}
          onForge={runForge}
          pending={status === "loading"}
        />

        {/* I-16：可选输出语言 / 表达偏好（自由文本，非下拉枚举；空值即不指定）。 */}
        <div className="space-y-1.5">
          <label
            htmlFor="output-locale"
            className="text-sm font-medium text-foreground"
          >
            输出语言 / 表达偏好
            <span className="ml-1 font-normal text-muted-foreground">（可选）</span>
          </label>
          <input
            id="output-locale"
            type="text"
            value={outputLocale}
            onChange={(event) => setOutputLocale(event.target.value)}
            placeholder="例如：zh-Hans、en-US、English for Instagram carousel"
            maxLength={MAX_OUTPUT_LOCALE_CHARS}
            disabled={status === "loading"}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
          />
        </div>

        {status !== "loading" && <ExampleIdeas onPick={setIdea} />}
      </section>

      {/* 假设条区域（UIUX §5.1：输入区与结果区之间）。首次生成后出现。 */}
      {assumptions.length > 0 && (
        <AssumptionPanel
          assumptions={assumptions}
          onEdit={editAssumption}
          onDismiss={dismissAssumption}
          onRestore={restoreAssumption}
          onRestoreAll={restoreAllAssumptions}
          onRegenerate={runForge}
          onRemember={rememberAssumption}
          rememberedKeys={rememberedKeys}
          pending={status === "loading"}
        />
      )}

      {/* 桌面端左右布局，移动端上下堆叠（UIUX §5.1 / §5.2）。 */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OutcomePanel
          status={status}
          outcome={data?.outcome ?? null}
          errorMessage={errorMessage}
          authRequired={authRequired}
          sessionId={sessionId}
          outputLocale={status === "success" ? outputLocale.trim() || null : null}
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
    </div>
  );
}

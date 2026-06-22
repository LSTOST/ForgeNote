import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookMarked, FileWarning } from "lucide-react";

import { RecipeRerun } from "@/components/recipes/RecipeRerun";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TopNav } from "@/components/layout/TopNav";
import { copy } from "@/lib/copy";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const c = copy.recipeDetail;

const INTENT_LABELS: Record<string, string> = {
  content_package: copy.intentTypes.content_package,
  xiaohongshu_note: copy.intentTypes.xiaohongshu_note,
  card_prompt: copy.intentTypes.card_prompt,
  generic_content: copy.intentTypes.generic_content,
};

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

// 不存在 / 他人 / 已删除 → 统一的合理「不可见」态，不泄露存在性。
function NotFoundState() {
  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/recipes"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="size-4" aria-hidden />
          {c.backToLibrary}
        </Link>
        <Card className="mt-6 flex min-h-72 flex-col items-center justify-center gap-3 border-dashed p-8 text-center">
          <FileWarning className="size-8 text-muted-foreground/60" aria-hidden />
          <h1 className="text-base font-medium">{c.notFoundTitle}</h1>
          <p className="max-w-sm text-sm text-muted-foreground">{c.notFoundBody}</p>
          <Link href="/recipes" className={buttonVariants()}>
            {c.backToLibraryBtn}
          </Link>
        </Card>
      </main>
    </>
  );
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const auth = await getAuthenticatedContext();
  if (!auth) {
    redirect("/login");
  }

  const { id } = await params;
  // 非法 UUID 直接按不可见处理，不暴露内部校验细节。
  if (!UUID_RE.test(id)) {
    return <NotFoundState />;
  }

  const { data: recipe, error } = await auth.supabase
    .from("recipes")
    .select(
      "id, name, intent_type, schema, fields, acceptance, variables, negative_rules, source_session_id, usage_count, created_at, updated_at",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  // 读取失败：作为不可见态处理（不泄露存在性，也不白屏）。
  if (error || !recipe) {
    return <NotFoundState />;
  }

  const fields = asRecord(recipe.fields);
  const schema = asRecord(recipe.schema);
  const coreFields: Array<{ label: string; value: string | null }> = [
    { label: c.audience, value: asString(fields.audience) },
    { label: c.goal, value: asString(fields.goal) },
    { label: c.tone, value: asString(fields.tone) },
    { label: c.visualStyle, value: asString(fields.visualStyle) },
  ];
  const structure = asStringArray(fields.structure);
  const variables = asStringArray(recipe.variables);
  const negativeRules = asStringArray(recipe.negative_rules);
  const acceptance = asStringArray(recipe.acceptance);
  const intentLabel = INTENT_LABELS[recipe.intent_type] ?? recipe.intent_type;
  const schemaSummary = `${asString(schema.intentType) ?? recipe.intent_type} · v${
    typeof schema.version === "number" ? schema.version : 1
  }`;

  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/recipes"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="size-4" aria-hidden />
          {c.backToLibrary}
        </Link>

        <header className="mt-6 mb-6 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <BookMarked className="size-5 text-primary" aria-hidden />
            <h1 className="text-2xl font-semibold tracking-tight">
              {recipe.name}
            </h1>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {intentLabel}
            </span>
          </div>
          <dl className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <Meta label={c.createdAt} value={formatDate(recipe.created_at)} />
            <Meta label={c.updatedAt} value={formatDate(recipe.updated_at)} />
            <Meta label={c.usageCount} value={`${recipe.usage_count ?? 0}`} />
            <Meta
              label={c.sourceSession}
              value={recipe.source_session_id ?? c.noSource}
              mono={Boolean(recipe.source_session_id)}
            />
          </dl>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-5 p-6">
            <h2 className="text-base font-semibold tracking-tight">{c.fieldsTitle}</h2>
            {coreFields.map((field) => (
              <Field key={field.label} label={field.label} value={field.value} />
            ))}
            <ListField label={c.structure} items={structure} />
            <ListField label={c.variables} items={variables} />
            <ListField label={c.negativeRules} items={negativeRules} />
            <ListField label={c.acceptance} items={acceptance} />
            <Field label={c.schema} value={schemaSummary} mono />
          </Card>

          <Card className="space-y-4 p-6">
            <RecipeRerun recipeId={recipe.id} />
          </Card>
        </div>
      </main>
    </>
  );
}

function Meta({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-medium text-foreground">{label}</dt>
      <dd className={mono ? "truncate font-mono" : "truncate"} title={value}>
        {value}
      </dd>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={
          mono
            ? "font-mono text-sm leading-relaxed text-foreground"
            : "text-sm leading-relaxed text-foreground"
        }
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

function ListField({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="list-disc space-y-0.5 pl-5 text-sm">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

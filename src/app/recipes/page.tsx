import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleAlert, Plus } from "lucide-react";

import {
  RecipesLibrary,
  type RecipeListItem,
} from "@/components/recipes/RecipesLibrary";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TopNav } from "@/components/layout/TopNav";
import { copy } from "@/lib/copy";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const INTENT_TYPES = [
  "content_package",
  "xiaohongshu_note",
  "card_prompt",
  "generic_content",
] as const;

type IntentType = (typeof INTENT_TYPES)[number];

interface RecipesPageProps {
  searchParams: Promise<{
    q?: string | string[];
    intentType?: string | string[];
  }>;
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function normalizeIntentType(value: string): IntentType | "all" {
  return INTENT_TYPES.includes(value as IntentType)
    ? (value as IntentType)
    : "all";
}

function escapeIlike(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
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

function buildSummary(fields: unknown): string | null {
  const snapshot = asRecord(fields);
  const parts = [
    asString(snapshot.audience),
    asString(snapshot.goal),
    asString(snapshot.tone),
    asString(snapshot.visualStyle),
  ].filter((part): part is string => Boolean(part));

  if (parts.length === 0) return null;
  return parts.slice(0, 3).join(" / ");
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const auth = await getAuthenticatedContext();
  if (!auth) {
    redirect("/login");
  }

  const params = await searchParams;
  const query = firstParam(params.q).trim();
  const intentType = normalizeIntentType(firstParam(params.intentType));

  let recipesQuery = auth.supabase
    .from("recipes")
    .select(
      "id, name, intent_type, fields, source_session_id, usage_count, created_at, updated_at",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (query.length > 0) {
    recipesQuery = recipesQuery.ilike("name", `%${escapeIlike(query)}%`);
  }
  if (intentType !== "all") {
    recipesQuery = recipesQuery.eq("intent_type", intentType);
  }

  const [recipesResult, countResult] = await Promise.all([
    recipesQuery,
    auth.supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
  ]);

  const hasError = Boolean(recipesResult.error || countResult.error);
  const recipes: RecipeListItem[] = (recipesResult.data ?? []).map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    intentType: recipe.intent_type,
    summary: buildSummary(recipe.fields),
    sourceSessionId: recipe.source_session_id,
    usageCount: recipe.usage_count ?? 0,
    createdAt: recipe.created_at,
    updatedAt: recipe.updated_at,
  }));

  const totalActiveCount = countResult.count ?? recipes.length;

  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {copy.recipes.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {copy.recipes.description}
            </p>
          </div>
          <Link href="/forge" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden />
            {copy.recipes.newRecipe}
          </Link>
        </header>

        {hasError ? (
          <Card className="flex min-h-72 flex-col items-center justify-center gap-3 border-destructive/30 p-8 text-center">
            <CircleAlert className="size-8 text-destructive" aria-hidden />
            <h2 className="text-base font-medium">配方库读取失败</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              数据库暂时不可用，请稍后重试。
            </p>
          </Card>
        ) : (
          <RecipesLibrary
            key={`${query}:${intentType}:${recipes.map((recipe) => recipe.id).join(",")}`}
            initialRecipes={recipes}
            initialQuery={query}
            initialIntentType={intentType}
            totalActiveCount={totalActiveCount}
          />
        )}
      </main>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookMarked,
  CircleAlert,
  CircleCheck,
  Eye,
  Filter,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { copy } from "@/lib/copy";

const c = copy.recipes;

export interface RecipeListItem {
  id: string;
  name: string;
  intentType: string;
  summary: string | null;
  sourceSessionId: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface RecipesLibraryProps {
  initialRecipes: RecipeListItem[];
  initialQuery: string;
  initialIntentType: string;
  totalActiveCount: number;
}

const INTENT_OPTIONS = [
  { value: "all", label: copy.intentTypes.all },
  { value: "content_package", label: copy.intentTypes.content_package },
  { value: "xiaohongshu_note", label: copy.intentTypes.xiaohongshu_note },
  { value: "card_prompt", label: copy.intentTypes.card_prompt },
  { value: "generic_content", label: copy.intentTypes.generic_content },
] as const;

const INTENT_LABELS: Record<string, string> = Object.fromEntries(
  INTENT_OPTIONS.map((option) => [option.value, option.label]),
);

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortId(value: string | null): string {
  if (!value) return c.noSource;
  return value.slice(0, 8);
}

function buildRecipesUrl(query: string, intentType: string): string {
  const params = new URLSearchParams();
  const trimmed = query.trim();
  if (trimmed) params.set("q", trimmed);
  if (intentType !== "all") params.set("intentType", intentType);
  const qs = params.toString();
  return qs ? `/recipes?${qs}` : "/recipes";
}

export function RecipesLibrary({
  initialRecipes,
  initialQuery,
  initialIntentType,
  totalActiveCount,
}: RecipesLibraryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [recipes, setRecipes] = useState(initialRecipes);
  const [activeCount, setActiveCount] = useState(totalActiveCount);
  const [query, setQuery] = useState(initialQuery);
  const [intentType, setIntentType] = useState(initialIntentType);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function applyFilters(nextQuery = query, nextIntentType = intentType) {
    setErrorMessage(null);
    setNotice(null);
    startTransition(() => {
      router.replace(buildRecipesUrl(nextQuery, nextIntentType));
    });
  }

  function resetFilters() {
    setQuery("");
    setIntentType("all");
    applyFilters("", "all");
  }

  async function deleteRecipe(recipe: RecipeListItem) {
    setDeletingId(recipe.id);
    setErrorMessage(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: "DELETE",
      });
      const json = await response.json().catch(() => null);

      if (!json?.ok) {
        setErrorMessage(json?.error?.message ?? c.deleteFailed);
        return;
      }

      setRecipes((current) => current.filter((item) => item.id !== recipe.id));
      setActiveCount((current) => Math.max(0, current - 1));
      setConfirmId(null);
      setNotice(c.deleted);
      router.refresh();
    } catch {
      setErrorMessage(copy.common.networkError);
    } finally {
      setDeletingId(null);
    }
  }

  const hasFilters = query.trim().length > 0 || intentType !== "all";
  const isEmpty = recipes.length === 0;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form
          className="grid gap-3 md:grid-cols-[1fr_220px_auto_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <label className="relative block">
            <span className="sr-only">{c.searchAria}</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={c.searchPlaceholder}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>

          <label className="relative block">
            <span className="sr-only">{c.filterAria}</span>
            <Filter
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <select
              value={intentType}
              onChange={(event) => {
                const nextIntent = event.target.value;
                setIntentType(nextIntent);
                applyFilters(query, nextIntent);
              }}
              className="h-9 w-full appearance-none rounded-lg border border-input bg-background pl-9 pr-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {INTENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <Button type="submit" disabled={isPending}>
            <Search className="size-4" aria-hidden />
            {isPending ? c.filtering : c.search}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={resetFilters}
            disabled={!hasFilters || isPending}
          >
            <X className="size-4" aria-hidden />
            {c.clear}
          </Button>
        </form>
      </Card>

      <div className="flex min-h-6 flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          {c.showing.replace("{n}", String(recipes.length))}
          {activeCount !== recipes.length
            ? c.ofTotal.replace("{n}", String(activeCount))
            : ""}
        </span>
        {isPending && <span>{c.loadingResults}</span>}
        {notice && (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CircleCheck className="size-4" aria-hidden />
            {notice}
          </span>
        )}
        {errorMessage && (
          <span className="inline-flex items-center gap-1 text-destructive">
            <CircleAlert className="size-4" aria-hidden />
            {errorMessage}
          </span>
        )}
      </div>

      {isPending && (
        <Card className="p-5" aria-hidden>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
              <div className="h-7 w-20 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </Card>
      )}

      {isEmpty ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <ul className={isPending ? "space-y-3 opacity-60" : "space-y-3"}>
          {recipes.map((recipe) => {
            const confirming = confirmId === recipe.id;
            const deleting = deletingId === recipe.id;
            return (
              <li key={recipe.id}>
                <Card className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="min-w-0 truncate text-base font-semibold tracking-tight underline-offset-4 hover:underline"
                        >
                          {recipe.name}
                        </Link>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          {INTENT_LABELS[recipe.intentType] ?? recipe.intentType}
                        </span>
                      </div>

                      {recipe.summary && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {recipe.summary}
                        </p>
                      )}

                      <dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                        <InfoItem label={c.createdAt} value={formatDate(recipe.createdAt)} />
                        <InfoItem label={c.updatedAt} value={formatDate(recipe.updatedAt)} />
                        <InfoItem label={c.usageCount} value={`${recipe.usageCount}`} />
                        <InfoItem
                          label={c.sourceSession}
                          value={shortId(recipe.sourceSessionId)}
                          title={recipe.sourceSessionId ?? undefined}
                          mono={Boolean(recipe.sourceSessionId)}
                        />
                      </dl>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {!confirming ? (
                        <>
                          <Link
                            href={`/recipes/${recipe.id}`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                            })}
                          >
                            <Eye className="size-3.5" aria-hidden />
                            {c.viewDetail}
                          </Link>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setConfirmId(recipe.id);
                              setErrorMessage(null);
                              setNotice(null);
                            }}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            {copy.common.delete}
                          </Button>
                        </>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {copy.common.confirmDeletePrompt}
                          </span>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteRecipe(recipe)}
                            disabled={deleting}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            {deleting ? copy.common.deleting : copy.common.confirmDelete}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmId(null)}
                            disabled={deleting}
                          >
                            {copy.common.cancel}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function InfoItem({
  label,
  value,
  title,
  mono = false,
}: {
  label: string;
  value: string;
  title?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-medium text-foreground">{label}</dt>
      <dd className={mono ? "truncate font-mono" : "truncate"} title={title ?? value}>
        {value}
      </dd>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center gap-3 border-dashed p-8 text-center">
      <BookMarked className="size-8 text-muted-foreground/60" aria-hidden />
      <h2 className="text-base font-medium">
        {hasFilters ? c.emptyFilteredTitle : c.emptyTitle}
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {hasFilters ? c.emptyFilteredBody : c.emptyBody}
      </p>
      {!hasFilters && (
        <Link href="/forge" className={buttonVariants()}>
          {c.goCreate}
        </Link>
      )}
    </Card>
  );
}

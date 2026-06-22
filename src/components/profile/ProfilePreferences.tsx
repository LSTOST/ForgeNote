"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CircleAlert,
  CircleCheck,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { copy } from "@/lib/copy";

const c = copy.profile;

export interface PreferenceItem {
  id: string;
  intentType: string;
  dimensionKey: string;
  dimensionLabel: string;
  value: string;
  source: string;
  updatedAt: string;
}

interface ProfilePreferencesProps {
  initialPreferences: PreferenceItem[];
}

const INTENT_OPTIONS = [
  { value: "content_package", label: copy.intentTypes.content_package },
  { value: "xiaohongshu_note", label: copy.intentTypes.xiaohongshu_note },
  { value: "card_prompt", label: copy.intentTypes.card_prompt },
  { value: "generic_content", label: copy.intentTypes.generic_content },
] as const;

const INTENT_LABELS: Record<string, string> = Object.fromEntries(
  INTENT_OPTIONS.map((o) => [o.value, o.label]),
);

const MAX_VALUE = 500;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ProfilePreferences({
  initialPreferences,
}: ProfilePreferencesProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(initialPreferences);

  // 新增表单状态。
  const [intentType, setIntentType] = useState<string>("content_package");
  const [dimensionKey, setDimensionKey] = useState("");
  const [dimensionLabel, setDimensionLabel] = useState("");
  const [value, setValue] = useState("");
  const [adding, setAdding] = useState(false);

  // 行内编辑 / 删除 / 反馈状态。
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canAdd =
    dimensionKey.trim().length > 0 &&
    dimensionLabel.trim().length > 0 &&
    value.trim().length > 0 &&
    !adding;

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function addPreference() {
    if (!canAdd) return;
    setAdding(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      const res = await fetch("/api/profile/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentType,
          dimensionKey: dimensionKey.trim(),
          dimensionLabel: dimensionLabel.trim(),
          value: value.trim(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        setErrorMessage(json?.error?.message ?? c.saveFailed);
        return;
      }
      setDimensionKey("");
      setDimensionLabel("");
      setValue("");
      setNotice(c.savedPref);
      refresh();
    } catch {
      setErrorMessage(copy.common.networkError);
    } finally {
      setAdding(false);
    }
  }

  async function saveEdit(item: PreferenceItem) {
    const next = editValue.trim();
    if (next.length === 0) return;
    setSavingId(item.id);
    setErrorMessage(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/profile/preferences/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: next }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        setErrorMessage(json?.error?.message ?? c.editFailed);
        return;
      }
      setItems((cur) =>
        cur.map((p) => (p.id === item.id ? { ...p, value: next } : p)),
      );
      setEditingId(null);
      setEditValue("");
      setNotice(c.updatedPref);
      refresh();
    } catch {
      setErrorMessage(copy.common.networkError);
    } finally {
      setSavingId(null);
    }
  }

  async function deletePreference(item: PreferenceItem) {
    setDeletingId(item.id);
    setErrorMessage(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/profile/preferences/${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        setErrorMessage(json?.error?.message ?? c.deleteFailed);
        return;
      }
      setItems((cur) => cur.filter((p) => p.id !== item.id));
      setConfirmId(null);
      setNotice(c.deletedPref);
      refresh();
    } catch {
      setErrorMessage(copy.common.networkError);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* 新增偏好（UIUX 工具型，不做营销页）。 */}
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold tracking-tight">{c.addTitle}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[160px_1fr_1fr_auto]">
          <label className="block">
            <span className="sr-only">{c.intentTypeAria}</span>
            <select
              value={intentType}
              onChange={(e) => setIntentType(e.target.value)}
              className="h-9 w-full appearance-none rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {INTENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <input
            value={dimensionLabel}
            onChange={(e) => setDimensionLabel(e.target.value)}
            placeholder={c.dimensionLabelPlaceholder}
            maxLength={80}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <input
            value={dimensionKey}
            onChange={(e) => setDimensionKey(e.target.value)}
            placeholder={c.dimensionKeyPlaceholder}
            maxLength={80}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none transition-colors placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button type="button" onClick={addPreference} disabled={!canAdd}>
            <Plus className="size-4" aria-hidden />
            {adding ? copy.common.saving : c.add}
          </Button>
        </div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={c.valuePlaceholder}
          maxLength={MAX_VALUE}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">{c.addHint}</p>
      </Card>

      <div className="flex min-h-6 flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>{c.count.replace("{n}", String(items.length))}</span>
        {isPending && <span>{c.refreshing}</span>}
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

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const editing = editingId === item.id;
            const saving = savingId === item.id;
            const confirming = confirmId === item.id;
            const deleting = deletingId === item.id;
            return (
              <li key={item.id}>
                <Card className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold tracking-tight">
                          {item.dimensionLabel}
                        </h3>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          {INTENT_LABELS[item.intentType] ?? item.intentType}
                        </span>
                        <span className="rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {item.dimensionKey}
                        </span>
                      </div>

                      {editing ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(item);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            maxLength={MAX_VALUE}
                            aria-label={c.editValueAria.replace("{label}", item.dimensionLabel)}
                            className="h-9 min-w-64 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => saveEdit(item)}
                            disabled={editValue.trim().length === 0 || saving}
                          >
                            {saving ? copy.common.saving : copy.common.save}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            disabled={saving}
                          >
                            {copy.common.cancel}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed text-foreground">
                          {item.value}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {c.updatedAt.replace("{date}", formatDate(item.updatedAt))}
                      </p>
                    </div>

                    {!editing && (
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {!confirming ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditValue(item.value);
                                setErrorMessage(null);
                                setNotice(null);
                              }}
                            >
                              <Pencil className="size-3.5" aria-hidden />
                              {copy.common.edit}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setConfirmId(item.id);
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
                              onClick={() => deletePreference(item)}
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
                    )}
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

function EmptyState() {
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center gap-3 border-dashed p-8 text-center">
      <SlidersHorizontal className="size-8 text-muted-foreground/60" aria-hidden />
      <h2 className="text-base font-medium">{c.emptyTitle}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{c.emptyBody}</p>
    </Card>
  );
}

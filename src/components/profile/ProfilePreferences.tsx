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
  { value: "content_package", label: "内容包" },
  { value: "xiaohongshu_note", label: "小红书笔记" },
  { value: "card_prompt", label: "卡片 Prompt" },
  { value: "generic_content", label: "通用内容" },
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
        setErrorMessage(json?.error?.message ?? "保存失败，请重试");
        return;
      }
      setDimensionKey("");
      setDimensionLabel("");
      setValue("");
      setNotice("已保存偏好");
      refresh();
    } catch {
      setErrorMessage("网络异常，请稍后重试");
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
        setErrorMessage(json?.error?.message ?? "修改失败，请重试");
        return;
      }
      setItems((cur) =>
        cur.map((p) => (p.id === item.id ? { ...p, value: next } : p)),
      );
      setEditingId(null);
      setEditValue("");
      setNotice("已更新偏好");
      refresh();
    } catch {
      setErrorMessage("网络异常，请稍后重试");
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
        setErrorMessage(json?.error?.message ?? "删除失败，请重试");
        return;
      }
      setItems((cur) => cur.filter((p) => p.id !== item.id));
      setConfirmId(null);
      setNotice("已删除偏好");
      refresh();
    } catch {
      setErrorMessage("网络异常，请稍后重试");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* 新增偏好（UIUX 工具型，不做营销页）。 */}
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold tracking-tight">新增偏好</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[160px_1fr_1fr_auto]">
          <label className="block">
            <span className="sr-only">内容类型</span>
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
            placeholder="维度名，如：语气"
            maxLength={80}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <input
            value={dimensionKey}
            onChange={(e) => setDimensionKey(e.target.value)}
            placeholder="维度 key，如：tone"
            maxLength={80}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none transition-colors placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button type="button" onClick={addPreference} disabled={!canAdd}>
            <Plus className="size-4" aria-hidden />
            {adding ? "保存中…" : "添加"}
          </Button>
        </div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="偏好值，如：成熟、克制、不焦虑"
          maxLength={MAX_VALUE}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">
          同一「内容类型 + 维度 key」重复添加会覆盖旧值。下次 Forge 生成时作为「来自偏好」假设带出。
        </p>
      </Card>

      <div className="flex min-h-6 flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>共 {items.length} 条偏好</span>
        {isPending && <span>正在刷新…</span>}
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
                            aria-label={`编辑 ${item.dimensionLabel} 的值`}
                            className="h-9 min-w-64 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => saveEdit(item)}
                            disabled={editValue.trim().length === 0 || saving}
                          >
                            {saving ? "保存中…" : "保存"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            disabled={saving}
                          >
                            取消
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed text-foreground">
                          {item.value}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        更新于 {formatDate(item.updatedAt)}
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
                              编辑
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
                              删除
                            </Button>
                          </>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              确认删除？
                            </span>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => deletePreference(item)}
                              disabled={deleting}
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                              {deleting ? "删除中…" : "确认删除"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmId(null)}
                              disabled={deleting}
                            >
                              取消
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
      <h2 className="text-base font-medium">还没有偏好</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        在上方添加常用的内容假设，或在 Forge 工作台编辑假设后点「记住为偏好」。下次生成会自动带出。
      </p>
    </Card>
  );
}

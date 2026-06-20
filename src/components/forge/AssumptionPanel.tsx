"use client";

import { useState } from "react";
import { Pencil, RotateCcw, RotateCw, Undo2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Assumption } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

interface AssumptionPanelProps {
  assumptions: Assumption[];
  /** 提交一条 value 编辑（state → edited）。 */
  onEdit: (key: string, value: string) => void;
  /** 软删除一条假设（state → dismissed），移入已删除区。 */
  onDismiss: (key: string) => void;
  /** 恢复一条已删除假设（state → default）。 */
  onRestore: (key: string) => void;
  /** 恢复全部已删除假设。 */
  onRestoreAll: () => void;
  /** 应用当前假设并重新生成（M1 无自动防抖，必须用户点击，UIUX §6.4）。 */
  onRegenerate: () => void;
  pending: boolean;
}

// 假设条编辑器（UIUX §6）。客户端本地状态：显示 / 编辑 value / dismiss / restore，
// 重新生成时由上层只提交 state != dismissed 的假设。不接 profile_preferences、不做自动偏好记忆。
export function AssumptionPanel({
  assumptions,
  onEdit,
  onDismiss,
  onRestore,
  onRestoreAll,
  onRegenerate,
  pending,
}: AssumptionPanelProps) {
  // 当前正在编辑的 chip key 与草稿值（仅面板内交互态）。
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const active = assumptions.filter((a) => a.state !== "dismissed");
  const dismissed = assumptions.filter((a) => a.state === "dismissed");

  function startEdit(a: Assumption) {
    if (pending) return;
    setEditingKey(a.key);
    setDraft(a.value);
  }

  function commitEdit(key: string) {
    const next = draft.trim();
    if (next.length > 0) onEdit(key, next);
    setEditingKey(null);
    setDraft("");
  }

  function cancelEdit() {
    setEditingKey(null);
    setDraft("");
  }

  return (
    <section className="space-y-3 rounded-xl ring-1 ring-foreground/10 bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold tracking-tight">内容假设</h2>
          <p className="text-xs text-muted-foreground">
            这些是系统对你想法的理解。点击可编辑，× 可删除，改完点「应用并重新生成」。
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={onRegenerate}
          disabled={pending}
        >
          <RotateCw className={cn("size-3.5", pending && "animate-spin")} aria-hidden />
          应用修改并重新生成
        </Button>
      </div>

      <ul className="flex flex-wrap gap-2">
        {active.map((a) => {
          const isEditing = editingKey === a.key;
          const isEdited = a.state === "edited";
          const fromProfile = a.source === "profile";

          if (isEditing) {
            return (
              <li key={a.key}>
                <span className="inline-flex items-center gap-1 rounded-full border border-ring bg-background px-2 py-1 text-xs ring-3 ring-ring/30">
                  <span className="text-muted-foreground">{a.label}：</span>
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(a.key);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    onBlur={() => commitEdit(a.key)}
                    aria-label={`编辑 ${a.label}`}
                    className="w-32 bg-transparent outline-none"
                  />
                </span>
              </li>
            );
          }

          return (
            <li key={a.key}>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
                  isEdited
                    ? "border-primary/60 bg-primary/5 text-foreground"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                <button
                  type="button"
                  onClick={() => startEdit(a)}
                  disabled={pending || !a.editable}
                  className="inline-flex items-center gap-1 disabled:cursor-not-allowed"
                  title={a.editable ? "点击编辑" : undefined}
                >
                  <span className="font-medium text-foreground/80">{a.label}</span>
                  <span>：{a.value}</span>
                  {a.editable && <Pencil className="size-3 opacity-50" aria-hidden />}
                </button>
                {isEdited && (
                  <span className="rounded bg-primary/15 px-1 text-[10px] font-medium text-primary">
                    已改
                  </span>
                )}
                {fromProfile && (
                  <span className="rounded bg-foreground/10 px-1 text-[10px]">
                    来自偏好
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onDismiss(a.key)}
                  disabled={pending}
                  aria-label={`删除假设 ${a.label}`}
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground disabled:opacity-50"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            </li>
          );
        })}
        {active.length === 0 && (
          <li className="text-xs text-muted-foreground">
            已删除全部假设，系统将仅依据原始输入生成。
          </li>
        )}
      </ul>

      {dismissed.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              已删除假设（{dismissed.length}）
            </p>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={onRestoreAll}
              disabled={pending}
            >
              <RotateCcw className="size-3" aria-hidden />
              恢复全部
            </Button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {dismissed.map((a) => (
              <li key={a.key}>
                <button
                  type="button"
                  onClick={() => onRestore(a.key)}
                  disabled={pending}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground line-through hover:text-foreground hover:no-underline disabled:opacity-50"
                  title="点击恢复"
                >
                  <Undo2 className="size-3" aria-hidden />
                  <span className="no-underline">{a.label}：{a.value}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

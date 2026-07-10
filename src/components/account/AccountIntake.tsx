"use client";

// ForgeNote M2-05 — 首屏账号分析入口。粘贴账号资料和近期内容 → 调账号接入 API。

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/marketing/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { AccountMemoryItem } from "@/lib/account/types";

interface IntakeResponse {
  ok: boolean;
  data?: { saved: number; dropped: number; items: AccountMemoryItem[] };
  error?: { code: string; message: string };
}

function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export function AccountIntake() {
  const router = useRouter();
  const [accountText, setAccountText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = accountText.trim().length > 0;

  async function submit() {
    setLoading(true);
    setError(null);
    const accountLines = toLines(accountText);
    try {
      const res = await fetch("/api/account/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileText: accountText.trim(),
          recentPosts: accountLines,
          performanceNotes: [],
          platform: "xiaohongshu",
        }),
      });
      const json: IntakeResponse = await res.json();
      if (!json.ok || !json.data) {
        setError(json.error?.message ?? "分析失败，请稍后重试");
        return;
      }
      router.push("/workspace");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-8 sm:px-8 lg:py-12">
      <div className="mb-10 flex items-center">
        <BrandMark size="sm" />
      </div>
      <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="mx-auto w-full max-w-[760px]">
          <p className="text-sm font-medium text-brand">账号分析</p>
          <h1 className="mt-3 text-[34px] leading-tight font-semibold text-text-primary sm:text-[40px]">
            先分析你的账号
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-text-secondary">
            粘贴账号简介和近期内容，ForgeNote 会判断你适合写什么、哪些表达有效、下一条内容该怎么做。
          </p>

          <div className="mt-8">
            <Field label="账号资料">
              <Textarea
                value={accountText}
                onChange={(e) => setAccountText(e.target.value)}
                rows={9}
                className="min-h-[220px] text-[15px] leading-7"
                placeholder="粘贴你的账号简介、定位、近期 3-5 条内容，或你想继续优化的账号方向……"
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={submit} disabled={!canSubmit || loading} size="lg">
              {loading ? "分析中…" : "分析我的账号"}
              {!loading && <ArrowRight className="size-4" aria-hidden />}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => router.push("/workspace")}
            >
              跳过，直接写一条内容
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </section>

        <aside className="space-y-3">
          {INTAKE_CARDS.map((card) => (
            <Card key={card.title} size="sm">
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
          <Card size="sm" className="bg-bg-panel shadow-none">
            <CardContent className="text-[13px] leading-6 text-text-secondary">
              分析结果会用于后续内容框架、正文和平台版本生成。成功后会直接进入工作台。
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

const INTAKE_CARDS = [
  {
    title: "账号定位",
    body: "识别你的受众、主题边界和表达风格。",
  },
  {
    title: "有效写法",
    body: "总结哪些内容更值得继续，哪些表达容易跑偏。",
  },
  {
    title: "下次建议",
    body: "给出选题、结构和平台方向，不再从空白开始。",
  },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-text-primary">{label}</span>
      {children}
    </label>
  );
}

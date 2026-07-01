"use client";

// ForgeNote /reset-password（DSN-02）——密码重置邮件链接的落点。
// 流程：邮件链接 → /auth/callback?next=/reset-password 交换出恢复会话 → 本页设新密码。
// 仅前端行为，沿用 Supabase updateUser；不改 RLS / 业务 API。

import { useEffect, useRef, useState } from "react";
import { CircleAlert, Eye, EyeOff, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { copy } from "@/lib/copy";
import { EmberMascot, type MascotHandle, type MascotPose } from "@/components/auth/EmberMascot";

type Phase = "checking" | "form" | "done" | "invalid";

const FIELD_CLASS =
  "h-11 w-full rounded-[13px] border border-[#E3D8C7] bg-[#FFFDF9] px-[15px] text-[16px] text-[#33291F] outline-none transition-colors placeholder:text-[#8b8378] focus-visible:border-[#B5562B] focus-visible:ring-3 focus-visible:ring-[#B5562B]/[0.28] disabled:opacity-50 sm:text-[15px]";

export default function ResetPasswordPage() {
  const configured = isSupabaseConfigured();
  const [phase, setPhase] = useState<Phase>(configured ? "checking" : "invalid");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mascot = useRef<MascotHandle>(null);

  // 落点须已有恢复会话（由 /auth/callback 交换得到）；否则视为链接失效。
  useEffect(() => {
    if (!configured) return;
    let active = true;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setPhase(data.session ? "form" : "invalid");
      } catch {
        if (active) setPhase("invalid");
      }
    })();
    return () => {
      active = false;
    };
  }, [configured]);

  const pose: MascotPose = submitting
    ? "loading"
    : phase === "done"
      ? "happy"
      : error
        ? "worried"
        : focused && !showPassword
          ? "cover"
          : focused && showPassword
            ? "avert"
            : "idle";

  useEffect(() => {
    mascot.current?.setPose(pose);
  }, [pose]);

  const passwordValid = password.length >= 8;
  const canSubmit = passwordValid && confirm.length >= 8 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordValid) return;
    if (password !== confirm) {
      setError(copy.reset.passwordMismatch);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(copy.reset.updateFailed);
        setSubmitting(false);
        return;
      }
      setPhase("done");
    } catch {
      setError(copy.reset.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[#F5EFE6] bg-[radial-gradient(rgba(120,90,50,0.045)_1px,transparent_1px)] px-5 py-8 text-[#33291F] [background-size:5px_5px] sm:px-6 sm:py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <EmberMascot ref={mascot} mode="single" className="size-[110px]" />
          <h1 className="mt-1 font-serif text-[28px] leading-tight font-medium text-[#33291F]">
            {phase === "done" ? copy.reset.doneTitle : copy.reset.newTitle}
          </h1>
          <p className="mt-2 text-[14px] leading-[1.5] text-[#8a7d6c]">
            {phase === "done" ? copy.reset.doneBody : copy.reset.newSubtitle}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-[13px] border border-[#b53c28]/30 bg-[#b53c28]/[0.06] p-3 text-[13.5px] leading-5 text-[#9e3322]"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        {phase === "checking" && (
          <div className="flex items-center justify-center gap-2 py-6 text-[14px] text-[#8a7d6c]">
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          </div>
        )}

        {phase === "invalid" && (
          <div
            role="alert"
            className="rounded-[14px] border border-[#b53c28]/30 bg-[#b53c28]/[0.06] p-4 text-[13.5px] leading-6 text-[#9e3322]"
          >
            <p>
              {configured ? copy.reset.linkInvalid : copy.login.notConfiguredBody}
            </p>
            <a
              href="/login"
              className="mt-3 inline-block text-[14px] font-semibold text-[#B5562B] underline-offset-4 hover:underline"
            >
              {copy.reset.backToSignIn}
            </a>
          </div>
        )}

        {phase === "form" && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <label htmlFor="new-password" className="sr-only">
                {copy.reset.newPasswordPlaceholder}
              </label>
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={copy.reset.newPasswordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={submitting}
                className={`${FIELD_CLASS} pr-[46px]`}
              />
              <button
                type="button"
                aria-label={
                  showPassword ? copy.login.hidePassword : copy.login.showPassword
                }
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-[9px] text-[#9c7a52] hover:text-[#33291F] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25"
              >
                {showPassword ? (
                  <EyeOff className="size-[18px]" aria-hidden />
                ) : (
                  <Eye className="size-[18px]" aria-hidden />
                )}
              </button>
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                {copy.reset.confirmPasswordPlaceholder}
              </label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={copy.reset.confirmPasswordPlaceholder}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={submitting}
                className={FIELD_CLASS}
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full gap-2 rounded-[13px] bg-[#B5562B] px-4 text-[15px] font-semibold text-[#FDF7EF] shadow-[0_2px_10px_rgba(150,70,30,0.22)] hover:bg-[#9f4924] focus-visible:border-[#B5562B] focus-visible:ring-[#B5562B]/[0.28] disabled:cursor-not-allowed disabled:bg-[#B5562B] disabled:opacity-60 disabled:shadow-none"
              disabled={!canSubmit}
            >
              {submitting ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : null}
              {submitting ? copy.reset.saving : copy.reset.saveNewPassword}
            </Button>
          </form>
        )}

        {phase === "done" && (
          <div className="text-center">
            <a
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-[13px] bg-[#B5562B] px-4 text-[15px] font-semibold text-[#FDF7EF] shadow-[0_2px_10px_rgba(150,70,30,0.22)] hover:bg-[#9f4924]"
            >
              {copy.reset.goSignIn}
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import { type FormEvent, useEffect, useState } from "react";
import { CircleAlert, Eye, EyeOff, Flame, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { copy } from "@/lib/copy";

type ResetState = "checking" | "ready" | "submitting" | "done" | "error";

const fieldClass =
  "h-11 w-full rounded-[13px] border border-[#E3D8C7] bg-[#FFFDF9] px-[15px] text-[15px] text-[#33291F] outline-none transition-colors placeholder:text-[#8b8378] focus-visible:border-[#B5562B] focus-visible:ring-3 focus-visible:ring-[#B5562B]/[0.28] disabled:opacity-50 sm:h-[46px] sm:text-[16px]";

export function ResetPasswordForm() {
  const configured = isSupabaseConfigured();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<ResetState>(() =>
    configured ? "checking" : "error",
  );
  const [error, setError] = useState<string | null>(() =>
    configured ? null : copy.login.notConfiguredTitle,
  );

  useEffect(() => {
    if (!configured) return;

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError || !data.session) {
        setState("error");
        setError(copy.login.resetLinkInvalid);
        return;
      }
      setState("ready");
    });
  }, [configured]);

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = passwordValid && passwordsMatch && state === "ready";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setState("submitting");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setState("error");
        setError(updateError.message || copy.login.resetUpdateFailed);
        return;
      }
      setState("done");
    } catch {
      setState("error");
      setError(copy.login.resetUpdateNetworkError);
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#F5EFE6] bg-[radial-gradient(rgba(120,90,50,0.045)_1px,transparent_1px)] [background-size:5px_5px] px-5 py-8 text-[#33291F]">
      <div className="w-full max-w-[344px]">
        <header className="mb-7 flex flex-col items-center text-center">
          <div className="mb-3 flex size-[48px] items-center justify-center rounded-[16px] bg-[#B5562B] text-[#FDF7EF] shadow-[0_2px_10px_rgba(150,70,30,0.22)]">
            <Flame className="size-6" aria-hidden />
          </div>
          <p className="font-serif text-[24px] font-semibold text-[#33291F]">
            ForgeNote
          </p>
          <h1 className="mt-6 font-serif text-[28px] leading-tight font-medium text-[#33291F]">
            {state === "done"
              ? copy.login.resetDoneTitle
              : copy.login.resetSetTitle}
          </h1>
          <p className="mt-2 text-[13.5px] leading-5 text-[#6f6253]">
            {state === "done"
              ? copy.login.resetDoneBody
              : copy.login.resetSetBody}
          </p>
        </header>

        {error ? (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-[13px] border border-[#b53c28]/30 bg-[#b53c28]/[0.06] p-3 text-[13.5px] leading-5 text-[#9e3322] shadow-[0_1px_10px_rgba(120,90,50,0.06)]"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        {state === "checking" ? (
          <div className="flex items-center justify-center gap-2 rounded-[14px] border border-[#E3D8C7] bg-[#FBF6EE] p-4 text-[13.5px] text-[#6f6253]">
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            {copy.login.resetChecking}
          </div>
        ) : state === "done" ? (
          <Button
            type="button"
            className="h-11 w-full rounded-[13px] bg-[#B5562B] px-4 text-[15px] font-semibold text-[#FDF7EF] shadow-[0_2px_10px_rgba(150,70,30,0.22)] hover:bg-[#9f4924] focus-visible:border-[#B5562B] focus-visible:ring-[#B5562B]/[0.28]"
            onClick={() => window.location.assign("/login")}
          >
            {copy.login.goToSignIn}
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={copy.login.newPasswordPlaceholder}
                aria-label={copy.login.newPasswordLabel}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (state === "error") setState("ready");
                  setError(null);
                }}
                disabled={state === "submitting"}
                className={`${fieldClass} pr-[46px]`}
              />
              <button
                type="button"
                className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-[9px] text-[#9c7a52] transition hover:bg-[#F5EFE6] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25"
                aria-label={
                  showPassword ? copy.login.hidePassword : copy.login.showPassword
                }
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff className="size-[18px]" aria-hidden />
                ) : (
                  <Eye className="size-[18px]" aria-hidden />
                )}
              </button>
            </div>
            <input
              type="password"
              autoComplete="new-password"
              placeholder={copy.login.confirmNewPasswordPlaceholder}
              aria-label={copy.login.confirmNewPasswordLabel}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (state === "error") setState("ready");
                setError(null);
              }}
              disabled={state === "submitting"}
              className={fieldClass}
            />
            {!passwordsMatch && confirmPassword ? (
              <p className="text-[13px] text-[#9e3322]">
                {copy.login.passwordMismatch}
              </p>
            ) : null}
            <Button
              type="submit"
              className="h-11 w-full rounded-[13px] bg-[#B5562B] px-4 text-[15px] font-semibold text-[#FDF7EF] shadow-[0_2px_10px_rgba(150,70,30,0.22)] hover:bg-[#9f4924] focus-visible:border-[#B5562B] focus-visible:ring-[#B5562B]/[0.28] disabled:cursor-not-allowed disabled:bg-[#B5562B] disabled:text-[#FDF7EF] disabled:shadow-none"
              disabled={!canSubmit}
            >
              {state === "submitting" ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : null}
              {state === "submitting"
                ? copy.login.passwordSubmitting
                : copy.login.saveNewPassword}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

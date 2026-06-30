"use client";

import { useState } from "react";
import { CircleAlert, LoaderCircle, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { copy } from "@/lib/copy";
import { SLOGAN } from "@/lib/constants";

interface LoginFormProps {
  /** 回调或上一次失败带回的错误（如 Google provider 未配置）。 */
  initialError?: string;
}

type OAuthState = "idle" | "redirecting" | "error";
type PasswordMode = "signIn" | "signUp";
type PasswordState = "idle" | "submitting" | "signupSent" | "error";

// 登录页表单（UIUX §4）：邮箱密码主路径 + Google 备用路径。
export function LoginForm({ initialError }: LoginFormProps) {
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("signIn");
  const [passwordState, setPasswordState] = useState<PasswordState>("idle");
  const [oauthState, setOauthState] = useState<OAuthState>("idle");
  // 表单级错误；初始可能来自 callback 的 ?error=。
  const [error, setError] = useState<string | null>(initialError ?? null);

  const busy = passwordState === "submitting" || oauthState === "redirecting";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 8;
  const passwordFormValid = emailValid && passwordValid;
  const modeTitle =
    passwordMode === "signIn"
      ? copy.login.signInModeTitle
      : copy.login.signUpModeTitle;
  const modeBody =
    passwordMode === "signIn"
      ? copy.login.signInModeBody
      : copy.login.signUpModeBody;

  async function handleGoogle() {
    setError(null);
    setOauthState("redirecting");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      // 成功时浏览器会被重定向到 Google；走到这里通常意味着 provider 未配置/失败。
      if (oauthError) {
        setError(oauthError.message || copy.login.googleUnavailable);
        setOauthState("error");
      }
    } catch {
      setError(copy.login.googleInitFailed);
      setOauthState("error");
    }
  }

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordFormValid) return;
    setError(null);
    setPasswordState("submitting");
    try {
      const supabase = createSupabaseBrowserClient();
      if (passwordMode === "signIn") {
        const { error: passwordError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (passwordError) {
          setError(getPasswordAuthError(passwordError));
          setPasswordState("error");
          return;
        }
        window.location.assign("/forge");
        return;
      }

      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (signupError) {
        setError(getPasswordAuthError(signupError));
        setPasswordState("error");
        return;
      }
      if (data.session) {
        window.location.assign("/forge");
        return;
      }
      setPasswordState("signupSent");
    } catch {
      setError(copy.login.passwordNetworkError);
      setPasswordState("error");
    }
  }

  return (
    <div className="w-full max-w-[380px] space-y-9">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-[38px] items-center justify-center rounded-[11px] bg-[#B5562B] text-[#FDF7EF] shadow-[0_2px_8px_rgba(150,70,30,0.25)]">
          <Zap className="size-[19px]" aria-hidden strokeWidth={2.2} />
        </div>
        <h1 className="font-serif text-[33px] leading-none font-medium text-[#33291F] sm:text-[36px]">
          ForgeNote
        </h1>
        <p className="break-keep text-[13px] leading-5 font-medium tracking-[0.06em] text-[#9c7a52]">
          图文卡片内容工作台
        </p>
        <p className="text-[14px] leading-[1.5] text-[#6f6253]">{SLOGAN}</p>
      </header>

      {!configured ? (
        <div className="rounded-[14px] border border-[#b53c28]/30 bg-[#b53c28]/[0.06] p-4 text-[13.5px] leading-6 text-[#9e3322] shadow-[0_1px_10px_rgba(120,90,50,0.06)]">
          <p className="font-medium">{copy.login.notConfiguredTitle}</p>
          <p className="mt-1 text-[#9e3322]/80">
            {copy.login.notConfiguredBody}
          </p>
        </div>
      ) : (
        <div className="space-y-[18px]">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-[13px] border border-[#b53c28]/30 bg-[#b53c28]/[0.06] p-3 text-[13.5px] leading-5 text-[#9e3322] shadow-[0_1px_10px_rgba(120,90,50,0.06)]"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          {passwordState === "signupSent" ? (
            <div className="rounded-[14px] border border-[#E3D8C7] bg-[#FBF6EE] p-4 text-[14px] leading-6 shadow-[0_1px_10px_rgba(120,90,50,0.06)]">
              <p className="font-medium text-[#33291F]">
                {copy.login.signupSentTitle}
              </p>
              <p className="mt-1 text-[#6f6253]">
                {copy.login.signupSentBodyPrefix}
                <span className="font-medium text-[#33291F]">{email.trim()}</span>
                {copy.login.signupSentBodySuffix}
              </p>
              <button
                type="button"
                className="mt-3 text-[14px] font-medium text-[#B5562B] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25"
                onClick={() => setPasswordState("idle")}
              >
                {copy.login.changeEmail}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-[18px] leading-6 font-semibold text-[#33291F]">
                  {modeTitle}
                </p>
                <p className="mt-1 text-[13.5px] leading-5 text-[#7a6b5a]">
                  {modeBody}
                </p>
              </div>

              <form onSubmit={handlePasswordAuth} className="space-y-3">
                <label htmlFor="email" className="sr-only">
                  {copy.login.emailLabel}
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={copy.login.emailPlaceholder}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setPasswordState("idle");
                  }}
                  disabled={busy}
                  className="h-11 w-full rounded-[13px] border border-[#E3D8C7] bg-[#FFFDF9] px-[15px] text-[15px] text-[#33291F] outline-none transition-colors placeholder:text-[#77716a] focus-visible:border-[#B5562B] focus-visible:ring-3 focus-visible:ring-[#B5562B]/[0.28] disabled:opacity-50"
                />
                <label htmlFor="password" className="sr-only">
                  {copy.login.passwordLabel}
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete={
                    passwordMode === "signIn"
                      ? "current-password"
                      : "new-password"
                  }
                  placeholder={copy.login.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  className="h-11 w-full rounded-[13px] border border-[#E3D8C7] bg-[#FFFDF9] px-[15px] text-[15px] text-[#33291F] outline-none transition-colors placeholder:text-[#77716a] focus-visible:border-[#B5562B] focus-visible:ring-3 focus-visible:ring-[#B5562B]/[0.28] disabled:opacity-50"
                />
                <Button
                  type="submit"
                  className="h-11 w-full rounded-[13px] bg-[#B5562B] px-4 text-[15px] font-semibold text-[#FDF7EF] shadow-[0_2px_10px_rgba(150,70,30,0.22)] hover:bg-[#9f4924] focus-visible:border-[#B5562B] focus-visible:ring-[#B5562B]/[0.28] disabled:cursor-not-allowed disabled:bg-[#B5562B] disabled:text-[#FDF7EF] disabled:shadow-none"
                  disabled={!passwordFormValid || busy}
                >
                  {passwordState === "submitting" ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  {passwordState === "submitting"
                    ? copy.login.passwordSubmitting
                    : passwordMode === "signIn"
                      ? copy.login.passwordSignInButton
                      : copy.login.passwordSignUpButton}
                </Button>
              </form>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-[#a99578]">
            <span className="h-px flex-1 bg-[#E3D8C7]" />
            或
            <span className="h-px flex-1 bg-[#E3D8C7]" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-[13px] border-[#E3D8C7] bg-transparent text-[14px] font-medium text-[#6f6253] hover:bg-[#FFFDF9]/65 hover:text-[#33291F] focus-visible:border-[#B5562B] focus-visible:ring-[#B5562B]/[0.28]"
            disabled={busy}
            onClick={handleGoogle}
          >
            {oauthState === "redirecting" ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <GoogleIcon />
            )}
            {copy.login.googleButton}
          </Button>

          <div className="space-y-2 text-center text-[13px] leading-6 text-[#9c7a52]">
            <p>
              {passwordMode === "signIn"
                ? copy.login.noAccountPrompt
                : copy.login.hasAccountPrompt}
              <button
                type="button"
                className="ml-1 font-semibold text-[#B5562B] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25 disabled:opacity-50"
                disabled={busy}
                onClick={() => {
                  setPasswordMode(
                    passwordMode === "signIn" ? "signUp" : "signIn",
                  );
                  setPasswordState("idle");
                  setError(null);
                }}
              >
                {passwordMode === "signIn"
                  ? copy.login.createAccountLink
                  : copy.login.returnToSignInLink}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getPasswordAuthError(error: { message?: string; code?: string }): string {
  if (error.code === "email_not_confirmed") {
    return copy.login.emailNotConfirmed;
  }
  if (error.code === "invalid_credentials") {
    return copy.login.invalidCredentials;
  }
  return error.message || copy.login.passwordAuthFailed;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z"
      />
    </svg>
  );
}

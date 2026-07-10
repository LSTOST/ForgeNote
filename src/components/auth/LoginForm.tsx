"use client";

import { useEffect, useState } from "react";
import { CircleAlert, Eye, EyeOff, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { copy } from "@/lib/copy";
import { DEFAULT_AUTH_REDIRECT_PATH } from "@/lib/auth/redirect";

interface LoginFormProps {
  /** 回调或上一次失败带回的错误（如 Google provider 未配置）。 */
  initialError?: string;
}

type View = "signIn" | "signUp" | "resetRequest" | "resetSent";
type OAuthState = "idle" | "redirecting" | "error";
type PasswordState = "idle" | "submitting" | "signupSent" | "error";
type ResetState = "idle" | "submitting" | "error";

const FIELD_CLASS =
  "h-12 rounded-xl border-border bg-card text-[15px] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25";
const PRIMARY_BTN =
  "mt-1 h-12 w-full gap-2 rounded-xl bg-accent text-[15px] font-semibold text-accent-foreground hover:opacity-90";
const THIRD_PARTY_BTN =
  "h-12 w-full gap-3 rounded-xl border-border bg-card text-[15px] font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-55";
const LINK_CLASS =
  "font-medium text-accent underline-offset-4 transition-opacity hover:opacity-80 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25 disabled:opacity-50";
const RESET_EMAIL_COOLDOWN_SECONDS = 60;

// 登录页表单（DSN-02）：邮箱密码为主 + Google 备选 + 忘记密码/重置；已移除 Magic Link。
export function LoginForm({ initialError }: LoginFormProps) {
  const configured = isSupabaseConfigured();

  const [view, setView] = useState<View>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [passwordState, setPasswordState] = useState<PasswordState>("idle");
  const [resetState, setResetState] = useState<ResetState>("idle");
  const [oauthState, setOauthState] = useState<OAuthState>("idle");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [resetCooldown, setResetCooldown] = useState(0);

  const busy =
    passwordState === "submitting" ||
    resetState === "submitting" ||
    oauthState === "redirecting";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 8;
  const isSignUp = view === "signUp";
  const confirmPasswordValid = !isSignUp || confirmPassword === password;
  const canSubmitPasswordAuth = emailValid && passwordValid && confirmPasswordValid;
  const resetCoolingDown = resetCooldown > 0;

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResetCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resetCooldown]);

  useEffect(() => {
    if (!configured || view !== "resetSent") return;
    let active = true;
    const supabase = createSupabaseBrowserClient();

    async function redirectIfSignedIn() {
      try {
        const { data } = await supabase.auth.getSession();
        if (active && data.session) {
          window.location.assign(DEFAULT_AUTH_REDIRECT_PATH);
        }
      } catch {
        // 留在当前等待态；用户仍可返回登录或稍后重发。
      }
    }

    function onVisible() {
      if (document.visibilityState === "visible") {
        void redirectIfSignedIn();
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        active &&
        session &&
        (event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED")
      ) {
        window.location.assign(DEFAULT_AUTH_REDIRECT_PATH);
      }
    });

    void redirectIfSignedIn();
    window.addEventListener("focus", redirectIfSignedIn);
    window.addEventListener("pageshow", redirectIfSignedIn);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("focus", redirectIfSignedIn);
      window.removeEventListener("pageshow", redirectIfSignedIn);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [configured, view]);

  function resetTransient() {
    setPasswordState("idle");
    setResetState("idle");
    setOauthState("idle");
    setError(null);
    setConfirmPassword("");
  }

  async function handleGoogle() {
    setError(null);
    setOauthState("redirecting");
    try {
      const supabase = createSupabaseBrowserClient({ remember });
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) {
        setError(copy.login.googleUnavailable);
        setOauthState("error");
      }
    } catch {
      setError(copy.login.googleInitFailed);
      setOauthState("error");
    }
  }

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitPasswordAuth) return;
    setError(null);
    setPasswordState("submitting");
    try {
      const supabase = createSupabaseBrowserClient({ remember });
      if (!isSignUp) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(getAuthError(signInError));
          setPasswordState("error");
          return;
        }
        window.location.assign(DEFAULT_AUTH_REDIRECT_PATH);
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (signUpError) {
        setError(getAuthError(signUpError));
        setPasswordState("error");
        return;
      }
      if (data.session) {
        window.location.assign(DEFAULT_AUTH_REDIRECT_PATH);
        return;
      }
      setSentTo(email.trim());
      setPasswordState("signupSent");
    } catch {
      setError(copy.login.networkError);
      setPasswordState("error");
    }
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || resetCoolingDown) return;
    setError(null);
    setResetState("submitting");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );
      if (resetError) {
        setError(copy.reset.sendFailed);
        setResetCooldown(RESET_EMAIL_COOLDOWN_SECONDS);
        setResetState("error");
        return;
      }
      setSentTo(email.trim());
      setResetCooldown(RESET_EMAIL_COOLDOWN_SECONDS);
      setResetState("idle");
      setView("resetSent");
    } catch {
      setError(copy.reset.networkError);
      setResetCooldown(RESET_EMAIL_COOLDOWN_SECONDS);
      setResetState("error");
    }
  }

  return (
    <div className="w-full">
      {!configured ? (
        <div
          role="alert"
          className="rounded-[var(--radius-lg)] border border-danger/30 bg-danger-soft p-4 text-[13.5px] leading-6 text-danger shadow-[var(--shadow-card)]"
        >
          <p className="font-medium">{copy.login.notConfiguredTitle}</p>
          <p className="mt-1 text-danger/80">{copy.login.notConfiguredBody}</p>
        </div>
      ) : (
        <>
          {!(passwordState === "signupSent" || view === "resetSent") && (
            <header className="mb-9">
              <h1 className="text-4xl font-semibold tracking-tight text-balance text-foreground">
                {viewTitle(view, isSignUp)}
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {viewSubtitle(view, isSignUp)}
              </p>
            </header>
          )}

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft p-3 text-[13.5px] leading-5 text-danger"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          {view === "resetSent" ? (
            <NoticeCard
              title={copy.reset.sentTitle}
              prefix={copy.reset.sentBodyPrefix}
              email={sentTo}
              suffix={copy.reset.sentBodySuffix}
            >
              <p className="mt-3 text-[13px] leading-5 text-text-secondary">
                {resetCoolingDown
                  ? copy.reset.cooldownHint.replace("{seconds}", String(resetCooldown))
                  : copy.reset.canResendHint}
              </p>
              <button
                type="button"
                className={`mt-3 mr-4 text-[14px] ${LINK_CLASS}`}
                disabled={resetCoolingDown}
                onClick={() => {
                  resetTransient();
                  setView("resetRequest");
                }}
              >
                {resetCoolingDown
                  ? copy.reset.resendIn.replace("{seconds}", String(resetCooldown))
                  : copy.reset.resend}
              </button>
              <button
                type="button"
                className="mt-3 text-[13px] font-medium text-text-secondary underline-offset-4 hover:underline"
                onClick={() => {
                  resetTransient();
                  setView("signIn");
                }}
              >
                {copy.reset.backToSignIn}
              </button>
            </NoticeCard>
          ) : passwordState === "signupSent" ? (
            <NoticeCard
              title={copy.login.signupSentTitle}
              prefix={copy.login.signupSentBodyPrefix}
              email={sentTo}
              suffix={copy.login.signupSentBodySuffix}
            >
              <button
                type="button"
                className={`mt-3 text-[14px] ${LINK_CLASS}`}
                onClick={() => setPasswordState("idle")}
              >
                {copy.login.changeEmail}
              </button>
            </NoticeCard>
          ) : view === "resetRequest" ? (
            <form onSubmit={handleResetRequest} className="space-y-3">
              <EmailField
                value={email}
                onChange={setEmail}
                disabled={busy}
              />
              <Button
                type="submit"
                className={PRIMARY_BTN}
                disabled={!emailValid || busy || resetCoolingDown}
              >
                {resetState === "submitting" ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                ) : null}
                {resetState === "submitting"
                  ? copy.reset.submitting
                  : resetCoolingDown
                    ? copy.reset.resendIn.replace("{seconds}", String(resetCooldown))
                    : copy.reset.submit}
              </Button>
              {resetCoolingDown ? (
                <p className="text-center text-[13px] leading-5 text-text-secondary">
                  {copy.reset.cooldownHint.replace("{seconds}", String(resetCooldown))}
                </p>
              ) : null}
              <div className="text-center">
                <button
                  type="button"
                  className="text-[13px] font-medium text-text-secondary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-soft"
                  onClick={() => {
                    resetTransient();
                    setView("signIn");
                  }}
                >
                  {copy.reset.backToSignIn}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className={THIRD_PARTY_BTN}
                  disabled={busy}
                  onClick={handleGoogle}
                >
                  {oauthState === "redirecting" ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <GoogleIcon />
                  )}
                  {oauthState === "redirecting" ? copy.login.googleRedirecting : "使用 Google 登录"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`${THIRD_PARTY_BTN} bg-bg-panel text-text-muted hover:bg-bg-panel disabled:opacity-100`}
                  disabled
                >
                  <WeChatIcon />
                  使用 微信 登录
                </Button>
              </div>

              <div className="my-7 flex items-center gap-4">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">或使用邮箱</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handlePasswordAuth} className="space-y-3">
                <EmailField
                  value={email}
                  onChange={setEmail}
                  disabled={busy}
                />
                <div className="relative">
                  <label htmlFor="password" className="sr-only">
                    {copy.login.passwordLabel}
                  </label>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    placeholder={
                      isSignUp
                        ? copy.login.passwordPlaceholderSignup
                        : copy.login.passwordPlaceholder
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                    className={`${FIELD_CLASS} pr-[46px]`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? copy.login.hidePassword : copy.login.showPassword}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-[9px] text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-soft"
                  >
                    {showPassword ? (
                      <EyeOff className="size-[18px]" aria-hidden />
                    ) : (
                      <Eye className="size-[18px]" aria-hidden />
                    )}
                  </button>
                </div>

                {isSignUp ? (
                  <div className="relative">
                    <label htmlFor="confirm-password" className="sr-only">
                      {copy.login.confirmPasswordLabel}
                    </label>
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={copy.login.confirmPasswordPlaceholder}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={busy}
                      className={`${FIELD_CLASS} pr-[46px]`}
                    />
                    <button
                      type="button"
                      aria-label={
                        showConfirmPassword ? copy.login.hidePassword : copy.login.showPassword
                      }
                      aria-pressed={showConfirmPassword}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-[9px] text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-soft"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-[18px]" aria-hidden />
                      ) : (
                        <Eye className="size-[18px]" aria-hidden />
                      )}
                    </button>
                  </div>
                ) : null}

                {!isSignUp && (
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="size-4 rounded-[5px] border-border accent-primary"
                      />
                      {copy.login.rememberFor30Days}
                    </label>
                    <button
                      type="button"
                      className="text-sm font-medium text-accent transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
                      onClick={() => {
                        resetTransient();
                        setView("resetRequest");
                      }}
                    >
                      {copy.login.forgotPassword}
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  className={PRIMARY_BTN}
                  disabled={!canSubmitPasswordAuth || busy}
                >
                  {passwordState === "submitting" ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  {passwordState === "submitting"
                    ? copy.login.submitting
                    : isSignUp
                      ? copy.login.signupSubmit
                      : "登录"}
                  </Button>
                </form>

              <p className="text-center text-sm text-muted-foreground">
                {isSignUp ? "已经有账号？" : "还没有账号？"}
                <button
                  type="button"
                  className={`ml-1 ${LINK_CLASS}`}
                  disabled={busy}
                  onClick={() => {
                    resetTransient();
                    setView(isSignUp ? "signIn" : "signUp");
                  }}
                >
                  {isSignUp ? "登录" : "创建账号"}
                </button>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function viewTitle(view: View, isSignUp: boolean): string {
  if (view === "resetRequest") return copy.reset.requestTitle;
  if (view === "resetSent") return copy.reset.sentTitle;
  return isSignUp ? "创建 ForgeNote 账号" : "欢迎回来";
}
function viewSubtitle(view: View, isSignUp: boolean): string {
  if (view === "resetRequest") return copy.reset.requestSubtitle;
  if (view === "resetSent") return copy.reset.requestSubtitle;
  return isSignUp ? "从账号分析开始，写下一条内容。" : "继续锻造你的下一条内容";
}

function EmailField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor="email" className="sr-only">
        {copy.login.emailLabel}
      </label>
      <Input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={copy.login.emailPlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={FIELD_CLASS}
      />
    </div>
  );
}

function NoticeCard({
  title,
  prefix,
  email,
  suffix,
  children,
}: {
  title: string;
  prefix: string;
  email: string;
  suffix: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-[var(--radius-lg)] border border-border-subtle bg-bg-card p-4 text-[14px] leading-6 shadow-[var(--shadow-card)]"
    >
      <p className="font-medium text-text-primary">{title}</p>
      <p className="mt-1 text-text-secondary">
        {prefix}
        <span className="font-medium text-text-primary">{email}</span>
        {suffix}
      </p>
      <div>{children}</div>
    </div>
  );
}

function getAuthError(error: { message?: string; code?: string }): string {
  if (error.code === "email_not_confirmed") return copy.login.authNeedsCheck;
  if (error.code === "invalid_credentials") return copy.login.invalidCredentials;
  return copy.login.authFailed;
}

function WeChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-[#07C160]" aria-hidden>
      <path
        fill="currentColor"
        d="M8.69 2.19C3.89 2.19 0 5.48 0 9.53c0 2.21 1.17 4.2 3 5.55.23.17.32.46.22.67l-.39 1.48a.7.7 0 0 0-.05.21c0 .16.13.3.29.3.06 0 .12-.02.17-.06l1.9-1.11c.21-.12.47-.16.72-.1.88.26 1.83.4 2.83.4.28 0 .54-.03.81-.05-.86-2.58.16-4.97 1.93-6.45 1.7-1.41 3.88-1.98 5.85-1.84-.57-3.58-4.19-6.34-8.59-6.34ZM5.79 5.99c.64 0 1.16.53 1.16 1.18a1.17 1.17 0 0 1-1.16 1.18 1.17 1.17 0 0 1-1.17-1.18c0-.65.52-1.18 1.17-1.18Zm5.81 0c.64 0 1.16.53 1.16 1.18a1.17 1.17 0 0 1-1.16 1.18 1.17 1.17 0 0 1-1.16-1.18c0-.65.52-1.18 1.16-1.18Zm5.34 2.87c-1.8-.05-3.75.51-5.28 1.78-1.72 1.43-2.69 3.72-1.78 6.22.94 2.6 3.75 4.43 7.06 4.43.88 0 1.71-.13 2.49-.36.2-.06.42-.03.6.08l1.59.93c.04.03.09.04.14.04.13 0 .24-.11.24-.25 0-.06-.02-.12-.04-.17l-.33-1.23a.58.58 0 0 1 .18-.56A6.25 6.25 0 0 0 24 14.98c0-3.43-3.18-6.18-7.06-6.18v.06Zm-2.97 3.11c.53 0 .97.44.97.98a.98.98 0 0 1-.97.98.98.98 0 0 1-.97-.98c0-.54.43-.98.97-.98Zm5.34 0c.53 0 .97.44.97.98a.98.98 0 0 1-.97.98.98.98 0 0 1-.97-.98c0-.54.43-.98.97-.98Z"
      />
    </svg>
  );
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

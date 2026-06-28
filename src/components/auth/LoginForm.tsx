"use client";

import { useState } from "react";
import { CircleAlert, KeyRound, LoaderCircle, Mail, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { copy } from "@/lib/copy";
import { PRODUCT_NAME, SLOGAN } from "@/lib/constants";

interface LoginFormProps {
  /** 回调或上一次失败带回的错误（如 Google provider 未配置）。 */
  initialError?: string;
}

type MagicLinkState = "idle" | "sending" | "sent" | "error";
type OAuthState = "idle" | "redirecting" | "error";
type PasswordMode = "signIn" | "signUp";
type PasswordState = "idle" | "submitting" | "signupSent" | "error";

// 登录页表单（UIUX §4）：Google 登录 + 邮箱密码主路径 + Magic Link 备用路径。
export function LoginForm({ initialError }: LoginFormProps) {
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("signIn");
  const [passwordState, setPasswordState] = useState<PasswordState>("idle");
  const [magicState, setMagicState] = useState<MagicLinkState>("idle");
  const [oauthState, setOauthState] = useState<OAuthState>("idle");
  // 表单级错误；初始可能来自 callback 的 ?error=。
  const [error, setError] = useState<string | null>(initialError ?? null);

  const busy =
    passwordState === "submitting" ||
    magicState === "sending" ||
    oauthState === "redirecting";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 8;
  const passwordConfirmValid =
    passwordMode === "signIn" || passwordConfirm === password;
  const passwordFormValid = emailValid && passwordValid && passwordConfirmValid;

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

  async function handleMagicLink() {
    if (!emailValid) return;
    setError(null);
    setMagicState("sending");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (otpError) {
        setError(otpError.message || copy.login.magicSendFailed);
        setMagicState("error");
        return;
      }
      setMagicState("sent");
    } catch {
      setError(copy.login.magicSendNetworkError);
      setMagicState("error");
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{PRODUCT_NAME}</h1>
        <p className="text-muted-foreground">{SLOGAN}</p>
      </header>

      {!configured ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p className="font-medium">{copy.login.notConfiguredTitle}</p>
          <p className="mt-1 text-destructive/80">
            {copy.login.notConfiguredBody}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="h-10 w-full"
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

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {copy.login.emailDivider}
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 rounded-lg border border-border bg-muted/30 p-1 text-sm">
            <button
              type="button"
              className={`rounded-md px-3 py-2 font-medium transition ${
                passwordMode === "signIn"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={busy}
              onClick={() => {
                setPasswordMode("signIn");
                setPasswordState("idle");
                setError(null);
              }}
            >
              {copy.login.passwordSignInTab}
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-2 font-medium transition ${
                passwordMode === "signUp"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={busy}
              onClick={() => {
                setPasswordMode("signUp");
                setPasswordState("idle");
                setError(null);
              }}
            >
              {copy.login.passwordSignUpTab}
            </button>
          </div>

          {passwordState === "signupSent" ? (
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <p className="font-medium text-foreground">
                {copy.login.signupSentTitle}
              </p>
              <p className="mt-1 text-muted-foreground">
                {copy.login.signupSentBodyPrefix}
                <span className="font-medium">{email.trim()}</span>
                {copy.login.signupSentBodySuffix}
              </p>
              <button
                type="button"
                className="mt-3 text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => setPasswordState("idle")}
              >
                {copy.login.changeEmail}
              </button>
            </div>
          ) : (
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
                  setMagicState("idle");
                }}
                disabled={busy}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              />
              <label htmlFor="password" className="sr-only">
                {copy.login.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                autoComplete={
                  passwordMode === "signIn" ? "current-password" : "new-password"
                }
                placeholder={copy.login.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              />
              {passwordMode === "signUp" ? (
                <>
                  <label htmlFor="password-confirm" className="sr-only">
                    {copy.login.passwordConfirmLabel}
                  </label>
                  <input
                    id="password-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder={copy.login.passwordConfirmPlaceholder}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    disabled={busy}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                  />
                </>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {passwordMode === "signIn"
                  ? copy.login.passwordSignInHint
                  : copy.login.passwordSignUpHint}
              </p>
              <Button
                type="submit"
                className="h-10 w-full"
                disabled={!passwordFormValid || busy}
              >
                {passwordState === "submitting" ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                ) : passwordMode === "signIn" ? (
                  <KeyRound className="size-4" aria-hidden />
                ) : (
                  <UserPlus className="size-4" aria-hidden />
                )}
                {passwordState === "submitting"
                  ? copy.login.passwordSubmitting
                  : passwordMode === "signIn"
                    ? copy.login.passwordSignInButton
                    : copy.login.passwordSignUpButton}
              </Button>
            </form>
          )}

          <div className="rounded-lg border border-dashed border-border p-3">
            {magicState === "sent" ? (
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  {copy.login.magicSentTitle}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {copy.login.magicSentBodyPrefix}
                  <span className="font-medium">{email.trim()}</span>
                  {copy.login.magicSentBodySuffix}
                </p>
                <button
                  type="button"
                  className="mt-3 text-sm text-primary underline-offset-4 hover:underline"
                  onClick={() => setMagicState("idle")}
                >
                  {copy.login.changeEmail}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {copy.login.magicBackupHint}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full"
                  disabled={!emailValid || busy}
                  onClick={handleMagicLink}
                >
                  {magicState === "sending" ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Mail className="size-4" aria-hidden />
                  )}
                  {magicState === "sending"
                    ? copy.login.sending
                    : copy.login.sendMagicLink}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {copy.login.footerNote}
      </p>
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

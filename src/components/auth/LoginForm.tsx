"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import {
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";

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

type AuthMode = "signIn" | "signUp";
type AuthView = "auth" | "resetRequest" | "resetSent";
type OAuthState = "idle" | "redirecting" | "error";
type FormState = "idle" | "submitting" | "signupSent" | "error";
type ResendState = "idle" | "submitting" | "sent" | "error";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fieldClass =
  "h-11 w-full rounded-[13px] border border-[#E3D8C7] bg-[#FFFDF9] px-[15px] text-[15px] text-[#33291F] outline-none transition-colors placeholder:text-[#8b8378] focus-visible:border-[#B5562B] focus-visible:ring-3 focus-visible:ring-[#B5562B]/[0.28] disabled:opacity-50 sm:h-[46px] sm:text-[16px]";

export function LoginForm({ initialError }: LoginFormProps) {
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [view, setView] = useState<AuthView>("auth");
  const [formState, setFormState] = useState<FormState>("idle");
  const [oauthState, setOauthState] = useState<OAuthState>("idle");
  const [signupResendState, setSignupResendState] =
    useState<ResendState>("idle");
  const [signupResendError, setSignupResendError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const emailValid = emailPattern.test(email.trim());
  const passwordValid = password.length >= 8;
  const busy = formState === "submitting" || oauthState === "redirecting";
  const resetReady = emailValid && !busy;
  const isSignIn = authMode === "signIn";

  async function handleGoogle() {
    setError(null);
    setOauthState("redirecting");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) {
        setError(oauthError.message || copy.login.googleUnavailable);
        setOauthState("error");
      }
    } catch {
      setError(copy.login.googleInitFailed);
      setOauthState("error");
    }
  }

  async function handlePasswordAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!emailValid || !passwordValid) {
      setError(copy.login.emailPasswordRequired);
      setFormState("error");
      return;
    }
    setError(null);
    setFormState("submitting");
    try {
      const supabase = createSupabaseBrowserClient();
      if (isSignIn) {
        const { error: passwordError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (passwordError) {
          setError(getPasswordAuthError(passwordError));
          setFormState("error");
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
        setFormState("error");
        return;
      }
      if (data.session) {
        window.location.assign("/forge");
        return;
      }
      setSignupResendState("idle");
      setSignupResendError(null);
      setFormState("signupSent");
    } catch {
      setError(copy.login.passwordNetworkError);
      setFormState("error");
    }
  }

  async function handleResendSignupConfirmation() {
    if (!emailValid) {
      setSignupResendError(copy.login.emailPasswordRequired);
      setSignupResendState("error");
      return;
    }
    setSignupResendError(null);
    setSignupResendState("submitting");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (resendError) {
        setSignupResendError(
          resendError.message || copy.login.signupResendFailed,
        );
        setSignupResendState("error");
        return;
      }
      setSignupResendState("sent");
    } catch {
      setSignupResendError(copy.login.signupResendFailed);
      setSignupResendState("error");
    }
  }

  async function handleResetRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resetReady) return;
    setError(null);
    setFormState("submitting");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/login/reset`,
        },
      );
      if (resetError) {
        setError(resetError.message || copy.login.resetSendFailed);
        setFormState("error");
        return;
      }
      setView("resetSent");
      setFormState("idle");
    } catch {
      setError(copy.login.resetSendNetworkError);
      setFormState("error");
    }
  }

  function switchMode(nextMode: AuthMode) {
    setAuthMode(nextMode);
    setView("auth");
    setFormState("idle");
    setSignupResendState("idle");
    setSignupResendError(null);
    setError(null);
    setPassword("");
  }

  function goResetRequest() {
    setView("resetRequest");
    setFormState("idle");
    setError(null);
  }

  function goAuth() {
    setView("auth");
    setFormState("idle");
    setError(null);
  }

  return (
    <section className="flex w-full overflow-hidden rounded-[3px] bg-[#FBF7F0] shadow-[0_18px_60px_rgba(74,52,31,0.13)] lg:min-h-screen lg:rounded-none lg:shadow-none">
      <BrandPanel status={statusFromState(formState, oauthState)} />

      <div className="flex min-h-[640px] flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:min-h-screen">
        <div className="w-full max-w-[344px]">
          <MobileBrand status={statusFromState(formState, oauthState)} />

          {!configured ? (
            <StateNotice tone="danger" title={copy.login.notConfiguredTitle}>
              {copy.login.notConfiguredBody}
            </StateNotice>
          ) : formState === "signupSent" ? (
            <SignupSent
              email={email}
              resendError={signupResendError}
              resendState={signupResendState}
              onChangeEmail={goAuth}
              onResend={handleResendSignupConfirmation}
            />
          ) : view === "resetRequest" ? (
            <ResetRequest
              email={email}
              busy={busy}
              error={error}
              resetReady={resetReady}
              onBack={goAuth}
              onEmailChange={(value) => {
                setEmail(value);
                setFormState("idle");
                setError(null);
              }}
              onSubmit={handleResetRequest}
            />
          ) : view === "resetSent" ? (
            <ResetSent email={email} onBack={goAuth} onResend={goResetRequest} />
          ) : (
            <>
              <header className="mb-7">
                <h1 className="font-serif text-[32px] leading-tight font-medium text-[#33291F]">
                  {isSignIn ? copy.login.signInTitle : copy.login.signUpTitle}
                </h1>
                <p className="mt-2 text-[14px] leading-5 text-[#8a7d6c]">
                  {isSignIn
                    ? copy.login.signInSubtitle
                    : copy.login.signUpSubtitle}
                </p>
              </header>

              <AuthError error={error} />

              <form onSubmit={handlePasswordAuth} className="space-y-4">
                <FieldLabel htmlFor="email">{copy.login.emailLabelShort}</FieldLabel>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={copy.login.emailPlaceholderShort}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFormState("idle");
                    setError(null);
                  }}
                  disabled={busy}
                  className={fieldClass}
                />

                <div className="space-y-[7px]">
                  <FieldLabel htmlFor="password">
                    {copy.login.passwordLabel}
                  </FieldLabel>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isSignIn ? "current-password" : "new-password"}
                      placeholder={
                        isSignIn
                          ? copy.login.passwordPlaceholderSignIn
                          : copy.login.passwordPlaceholderSignUp
                      }
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFormState("idle");
                        setError(null);
                      }}
                      disabled={busy}
                      className={`${fieldClass} pr-[46px]`}
                    />
                    <button
                      type="button"
                      className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-[9px] text-[#9c7a52] transition hover:bg-[#F5EFE6] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25"
                      aria-label={
                        showPassword
                          ? copy.login.hidePassword
                          : copy.login.showPassword
                      }
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={busy}
                    >
                      {showPassword ? (
                        <EyeOff className="size-[18px]" aria-hidden />
                      ) : (
                        <Eye className="size-[18px]" aria-hidden />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="flex min-w-0 cursor-pointer items-center gap-2 text-[13px] text-[#6f6253]">
                    <input
                      type="checkbox"
                      checked={rememberSession}
                      onChange={(event) =>
                        setRememberSession(event.currentTarget.checked)
                      }
                      disabled={busy}
                      className="size-4 shrink-0 rounded-[3px] border-[#CDBEA7] text-[#B5562B] accent-[#B5562B] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span>{copy.login.rememberThirtyDays}</span>
                  </label>
                  <button
                    type="button"
                    className="shrink-0 text-[13px] font-semibold text-[#B5562B] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25"
                    onClick={goResetRequest}
                    disabled={busy}
                  >
                    {copy.login.forgotPassword}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-[13px] bg-[#B5562B] px-4 text-[15px] font-semibold text-[#FDF7EF] shadow-[0_2px_10px_rgba(150,70,30,0.22)] hover:bg-[#9f4924] focus-visible:border-[#B5562B] focus-visible:ring-[#B5562B]/[0.28] disabled:cursor-not-allowed disabled:bg-[#B5562B] disabled:text-[#FDF7EF] disabled:shadow-none sm:h-[46px]"
                  disabled={busy}
                >
                  {formState === "submitting" ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  {formState === "submitting"
                    ? copy.login.passwordSubmitting
                    : isSignIn
                      ? copy.login.primarySignIn
                      : copy.login.primarySignUp}
                </Button>
              </form>

              <Divider />

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-[13px] border-[#E3D8C7] bg-transparent text-[14px] font-medium text-[#6f6253] hover:bg-[#FFFDF9]/65 hover:text-[#33291F] focus-visible:border-[#B5562B] focus-visible:ring-[#B5562B]/[0.28] sm:h-[46px]"
                disabled={busy}
                onClick={handleGoogle}
              >
                {oauthState === "redirecting" ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                ) : (
                  <GoogleIcon />
                )}
                {oauthState === "redirecting"
                  ? copy.login.googleRedirecting
                  : copy.login.googleButton}
              </Button>

              <p className="mt-5 text-center text-[13px] leading-6 text-[#8a7d6c]">
                {isSignIn
                  ? copy.login.noAccountPrompt
                  : copy.login.hasAccountPrompt}
                <button
                  type="button"
                  className="ml-1 font-semibold text-[#B5562B] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25 disabled:opacity-50"
                  disabled={busy}
                  onClick={() => switchMode(isSignIn ? "signUp" : "signIn")}
                >
                  {isSignIn
                    ? copy.login.createAccountLink
                    : copy.login.returnToSignInLink}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function statusFromState(
  formState: FormState,
  oauthState: OAuthState,
): "idle" | "loading" | "error" | "success" {
  if (oauthState === "redirecting" || formState === "submitting") return "loading";
  if (formState === "signupSent") return "success";
  if (formState === "error" || oauthState === "error") return "error";
  return "idle";
}

function BrandPanel({
  status,
}: {
  status: "idle" | "loading" | "error" | "success";
}) {
  return (
    <aside className="relative hidden min-h-[660px] w-[524px] shrink-0 overflow-hidden bg-[#EEE0C9] bg-[radial-gradient(rgba(120,90,50,0.06)_1px,transparent_1px)] [background-size:6px_6px] lg:block">
      <div className="absolute left-[18px] top-[12px]">
        <span className="font-serif text-[30px] leading-none font-semibold text-[#33291F]">
          ForgeNote
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-[50px] top-[70px] flex items-end justify-center">
        <MascotGroup status={status} scale="hero" />
      </div>
    </aside>
  );
}

function MobileBrand({
  status,
}: {
  status: "idle" | "loading" | "error" | "success";
}) {
  return (
    <header className="mb-7 flex flex-col items-center text-center lg:hidden">
      <StateMascot status={status} className="mb-3" />
      <h1 className="font-serif text-[31px] leading-none font-medium text-[#33291F]">
        ForgeNote
      </h1>
      <p className="mt-2 break-keep text-[12px] leading-5 font-medium tracking-[0.06em] text-[#9c7a52]">
        {copy.login.productCategory}
      </p>
      <p className="mt-1 text-[13.5px] leading-[1.5] text-[#6f6253]">
        {SLOGAN}
      </p>
    </header>
  );
}

function MascotGroup({
  status,
  scale = "hero",
}: {
  status: "idle" | "loading" | "error" | "success";
  scale?: "hero" | "state";
}) {
  return (
    <div
      className={[
        "relative transition-transform duration-200 motion-reduce:transition-none",
        scale === "hero" ? "h-[520px] w-[620px]" : "h-[430px] w-[500px]",
        status === "success" ? "motion-safe:animate-pulse" : "",
        status === "error" ? "motion-safe:animate-pulse" : "",
      ].join(" ")}
      aria-hidden
    >
      <div className="absolute left-[42px] bottom-[18px] h-3 w-[500px] rounded-full bg-[#D8C8AF]/75 blur-[1px]" />
      <div className="absolute left-[116px] bottom-[28px] h-[410px] w-[150px] rotate-[-6deg] rounded-[30px] bg-[#6C4CF6] shadow-[0_16px_46px_rgba(84,58,186,0.18)]" />
      <div className="absolute left-[300px] bottom-[28px] h-[276px] w-[112px] rounded-[28px] bg-[#2E2E2E]" />
      <div className="absolute left-[44px] bottom-[28px] h-[176px] w-[256px] rounded-t-full bg-[#F08B4F]" />
      <div className="absolute left-[392px] bottom-[28px] h-[188px] w-[188px] rounded-t-full bg-[#E7D63A]" />

      <div className="absolute left-[150px] top-[118px] flex gap-[32px]">
        <EyeDot status={status} inverted />
        <EyeDot status={status} inverted />
      </div>
      <div className="absolute left-[326px] top-[220px] flex gap-[32px]">
        <EyeDot status={status} inverted />
        <EyeDot status={status} inverted />
      </div>
      <div className="absolute left-[112px] bottom-[112px] flex gap-[58px]">
        <EyeDot small status={status} />
        <EyeDot small status={status} />
      </div>
      <div className="absolute left-[440px] bottom-[126px] flex gap-[52px]">
        <EyeDot small status={status} />
        <EyeDot small status={status} />
      </div>
      <div className="absolute left-[480px] bottom-[82px] h-[10px] w-[54px] border-b-[4px] border-[#2C2C2C] opacity-95" />
      {status === "loading" ? (
        <div className="absolute left-[280px] top-[34px] size-10 animate-spin rounded-full border-2 border-[#B5562B]/25 border-t-[#B5562B] motion-reduce:animate-none" />
      ) : null}
    </div>
  );
}

function StateMascot({
  status,
  className = "",
}: {
  status: "idle" | "loading" | "error" | "success";
  className?: string;
}) {
  return (
    <div
      className={[
        "relative mx-auto h-[104px] w-[128px] overflow-hidden",
        className,
      ].join(" ")}
      aria-hidden
    >
      <div className="absolute left-1/2 top-[58%] origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.24]">
        <MascotGroup status={status} scale="state" />
      </div>
    </div>
  );
}

function EyeDot({
  status,
  small = false,
  inverted = false,
}: {
  status: "idle" | "loading" | "error" | "success";
  small?: boolean;
  inverted?: boolean;
}) {
  const size = small ? "size-[11px]" : "size-[28px]";
  const shape =
    status === "loading" ? "h-1.5 w-3 rounded-full" : `${size} rounded-full`;
  if (!inverted) {
    return <span className={`${shape} bg-[#171717]`} />;
  }
  return (
    <span
      className={`${shape} flex items-center justify-center bg-[#FFFDF9] shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}
    >
      <span className="size-[14px] rounded-full bg-[#171717]" />
    </span>
  );
}

function AuthError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-[13px] border border-[#b53c28]/30 bg-[#b53c28]/[0.06] p-3 text-[13.5px] leading-5 text-[#9e3322] shadow-[0_1px_10px_rgba(120,90,50,0.06)]"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{error}</span>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-[#5c5347]">
      {children}
    </label>
  );
}

function StateNotice({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <div
      className={[
        "rounded-[14px] border p-4 text-[13.5px] leading-6 shadow-[0_1px_10px_rgba(120,90,50,0.06)]",
        tone === "danger"
          ? "border-[#b53c28]/30 bg-[#b53c28]/[0.06] text-[#9e3322]"
          : "border-[#E3D8C7] bg-[#FBF6EE] text-[#6f6253]",
      ].join(" ")}
    >
      <p className={tone === "danger" ? "font-medium" : "font-semibold text-[#33291F]"}>
        {title}
      </p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

function SignupSent({
  email,
  resendError,
  resendState,
  onChangeEmail,
  onResend,
}: {
  email: string;
  resendError: string | null;
  resendState: ResendState;
  onChangeEmail: () => void;
  onResend: () => void;
}) {
  const resending = resendState === "submitting";
  return (
    <div className="space-y-5">
      <StateMascot status="success" />
      <StateNotice title={copy.login.signupSentTitle}>
        {copy.login.signupSentBodyPrefix}
        <span className="font-semibold text-[#33291F]">{email.trim()}</span>
        {copy.login.signupSentBodySuffix}
      </StateNotice>
      {resendState === "sent" ? (
        <p className="rounded-[13px] border border-[#2f8f5b]/25 bg-[#2f8f5b]/[0.07] p-3 text-[13px] leading-5 text-[#2f6f4a]">
          {copy.login.signupResent}
        </p>
      ) : null}
      {resendError ? (
        <p
          role="alert"
          className="rounded-[13px] border border-[#b53c28]/30 bg-[#b53c28]/[0.06] p-3 text-[13px] leading-5 text-[#9e3322]"
        >
          {resendError}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          className="h-11 rounded-[13px] bg-[#B5562B] px-4 text-[14px] font-semibold text-[#FDF7EF] shadow-[0_2px_10px_rgba(150,70,30,0.18)] hover:bg-[#9f4924] disabled:cursor-not-allowed disabled:bg-[#B5562B] disabled:text-[#FDF7EF] sm:flex-1"
          onClick={onResend}
          disabled={resending}
        >
          {resending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : null}
          {resending ? copy.login.signupResending : copy.login.signupResend}
        </Button>
        <button
          type="button"
          className="text-[13.5px] font-semibold text-[#B5562B] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25 disabled:opacity-50"
          onClick={onChangeEmail}
          disabled={resending}
        >
          {copy.login.changeEmail}
        </button>
      </div>
    </div>
  );
}

function ResetRequest({
  email,
  busy,
  error,
  resetReady,
  onBack,
  onEmailChange,
  onSubmit,
}: {
  email: string;
  busy: boolean;
  error: string | null;
  resetReady: boolean;
  onBack: () => void;
  onEmailChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <header className="mb-6 text-center">
        <StateMascot status="idle" className="mb-3" />
        <h1 className="font-serif text-[28px] leading-tight font-medium text-[#33291F]">
          {copy.login.resetTitle}
        </h1>
        <p className="mt-2 text-[13.5px] leading-5 text-[#6f6253]">
          {copy.login.resetBody}
        </p>
      </header>
      <AuthError error={error} />
      <form onSubmit={onSubmit} className="space-y-4">
        <label htmlFor="reset-email" className="sr-only">
          {copy.login.emailLabel}
        </label>
        <input
          id="reset-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={copy.login.emailPlaceholder}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={busy}
          className={fieldClass}
        />
        <Button
          type="submit"
          className="h-11 w-full rounded-[13px] bg-[#B5562B] px-4 text-[15px] font-semibold text-[#FDF7EF] shadow-[0_2px_10px_rgba(150,70,30,0.22)] hover:bg-[#9f4924] focus-visible:border-[#B5562B] focus-visible:ring-[#B5562B]/[0.28] disabled:cursor-not-allowed disabled:bg-[#B5562B] disabled:text-[#FDF7EF] disabled:shadow-none"
          disabled={!resetReady}
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          {busy ? copy.login.sending : copy.login.resetSendButton}
        </Button>
      </form>
      <button
        type="button"
        className="mt-5 block w-full text-center text-[13px] font-medium text-[#9c7a52] hover:text-[#B5562B] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25"
        onClick={onBack}
        disabled={busy}
      >
        {copy.login.backToSignIn}
      </button>
    </>
  );
}

function ResetSent({
  email,
  onBack,
  onResend,
}: {
  email: string;
  onBack: () => void;
  onResend: () => void;
}) {
  return (
    <div className="space-y-5 text-center">
      <StateMascot status="success" />
      <StateNotice title={copy.login.resetSentTitle}>
        {copy.login.resetSentBodyPrefix}
        <span className="font-semibold text-[#33291F]">{email.trim()}</span>
        {copy.login.resetSentBodySuffix}
      </StateNotice>
      <p className="text-[12.5px] text-[#9c7a52]">
        {copy.login.resetNotReceived}
        <button
          type="button"
          className="ml-1 font-semibold text-[#B5562B] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25"
          onClick={onResend}
        >
          {copy.login.resetResend}
        </button>
      </p>
      <button
        type="button"
        className="text-[13px] font-medium text-[#9c7a52] hover:text-[#B5562B] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25"
        onClick={onBack}
      >
        {copy.login.backToSignIn}
      </button>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-[#a99578]">
      <span className="h-px flex-1 bg-[#E3D8C7]" />
      {copy.login.orDivider}
      <span className="h-px flex-1 bg-[#E3D8C7]" />
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

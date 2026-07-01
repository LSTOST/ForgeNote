"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, Eye, EyeOff, LoaderCircle, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { copy } from "@/lib/copy";
import { SLOGAN } from "@/lib/constants";
import { EmberMascot, type MascotHandle, type MascotPose } from "./EmberMascot";

interface LoginFormProps {
  /** 回调或上一次失败带回的错误（如 Google provider 未配置）。 */
  initialError?: string;
}

type View = "signIn" | "signUp" | "resetRequest" | "resetSent";
type OAuthState = "idle" | "redirecting" | "error";
type PasswordState = "idle" | "submitting" | "signupSent" | "error";
type ResetState = "idle" | "submitting" | "error";
type FocusField = "email" | "password" | null;

const FIELD_CLASS =
  "h-11 w-full rounded-[13px] border border-[#E3D8C7] bg-[#FFFDF9] px-[15px] text-[16px] text-[#33291F] outline-none transition-colors placeholder:text-[#8b8378] focus-visible:border-[#B5562B] focus-visible:ring-3 focus-visible:ring-[#B5562B]/[0.28] disabled:opacity-50 sm:text-[15px]";
const PRIMARY_BTN =
  "h-11 w-full gap-2 rounded-[13px] bg-[#B5562B] px-4 text-[15px] font-semibold text-[#FDF7EF] shadow-[0_2px_10px_rgba(150,70,30,0.22)] hover:bg-[#9f4924] focus-visible:border-[#B5562B] focus-visible:ring-[#B5562B]/[0.28] disabled:cursor-not-allowed disabled:bg-[#B5562B] disabled:text-[#FDF7EF] disabled:opacity-60 disabled:shadow-none";
const LINK_CLASS =
  "font-semibold text-[#B5562B] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25 disabled:opacity-50";

// 登录页表单（DSN-02）：邮箱密码为主 + Google 备选 + 忘记密码/重置；已移除 Magic Link。
export function LoginForm({ initialError }: LoginFormProps) {
  const configured = isSupabaseConfigured();

  const [view, setView] = useState<View>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [focusField, setFocusField] = useState<FocusField>(null);
  const [passwordState, setPasswordState] = useState<PasswordState>("idle");
  const [resetState, setResetState] = useState<ResetState>("idle");
  const [oauthState, setOauthState] = useState<OAuthState>("idle");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);

  const deskMascot = useRef<MascotHandle>(null);
  const mobMascot = useRef<MascotHandle>(null);
  const deskWrap = useRef<HTMLDivElement>(null);
  const mobWrap = useRef<HTMLDivElement>(null);
  const charPanel = useRef<HTMLDivElement>(null);

  const busy =
    passwordState === "submitting" ||
    resetState === "submitting" ||
    oauthState === "redirecting";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 8;
  const isSignUp = view === "signUp";

  // 姿态：由当前状态推导，仅在交互/状态变化时发生（无首屏自动播放）。
  const pose: MascotPose = (() => {
    if (busy) return "loading";
    if (passwordState === "error" || resetState === "error" || oauthState === "error")
      return "worried";
    if (passwordState === "signupSent" || view === "resetSent") return "happy";
    if (focusField === "password") return showPassword ? "avert" : "cover";
    if (focusField === "email") return "glance";
    return "idle";
  })();

  useEffect(() => {
    deskMascot.current?.setPose(pose);
    mobMascot.current?.setPose(pose);
  }, [pose]);

  // 成功/失败一次性体态（hop/shake）；用 ref 直接挂 class，reduced-motion 下跳过。
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const cls = pose === "happy" ? "fn-hop" : pose === "worried" ? "fn-shake" : null;
    if (!cls) return;
    const wraps = [deskWrap.current, mobWrap.current];
    wraps.forEach((w) => {
      if (!w) return;
      w.classList.remove("fn-hop", "fn-shake");
      void w.offsetWidth; // 重启动画
      w.classList.add(cls);
    });
    const t = setTimeout(
      () => wraps.forEach((w) => w?.classList.remove("fn-hop", "fn-shake")),
      700,
    );
    return () => clearTimeout(t);
  }, [pose]);

  // 桌面：瞳孔随光标（rAF 节流；reduced-motion 由 mascot 内部忽略）。
  useEffect(() => {
    const panel = charPanel.current;
    if (!panel) return;
    let raf = 0;
    function onMove(e: PointerEvent) {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = panel!.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * 2 - 1;
        const py = ((e.clientY - r.top) / r.height) * 2 - 1;
        deskMascot.current?.setGaze(px, py);
      });
    }
    panel.addEventListener("pointermove", onMove);
    return () => {
      panel.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  function resetTransient() {
    setPasswordState("idle");
    setResetState("idle");
    setOauthState("idle");
    setError(null);
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
    if (!(emailValid && passwordValid)) return;
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
        window.location.assign("/forge");
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
        window.location.assign("/forge");
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
    if (!emailValid) return;
    setError(null);
    setResetState("submitting");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        },
      );
      if (resetError) {
        setError(resetError.message || copy.reset.sendFailed);
        setResetState("error");
        return;
      }
      setSentTo(email.trim());
      setResetState("idle");
      setView("resetSent");
    } catch {
      setError(copy.reset.networkError);
      setResetState("error");
    }
  }

  return (
    <div className="w-full max-w-[380px] lg:max-w-[860px]">
      <div className="overflow-hidden rounded-[16px] lg:flex lg:min-h-[560px] lg:border lg:border-[#E3D8C7] lg:bg-[#FBF7F0] lg:shadow-[0_18px_50px_-24px_rgba(80,50,20,0.4)]">
        {/* 桌面左侧角色区 */}
        <div
          ref={charPanel}
          className="relative hidden shrink-0 items-end justify-center bg-[#EEE0C9] bg-[radial-gradient(rgba(120,90,50,0.05)_1px,transparent_1px)] p-6 [background-size:6px_6px] lg:flex lg:w-[372px]"
        >
          <div className="absolute top-7 left-8 flex items-center gap-2.5">
            <span className="flex size-[38px] items-center justify-center rounded-[11px] bg-[#B5562B] text-[#FDF7EF] shadow-[0_2px_8px_rgba(150,70,30,0.25)]">
              <Zap className="size-[19px]" aria-hidden strokeWidth={2.2} />
            </span>
            <span className="font-serif text-[20px] font-semibold text-[#33291F]">
              ForgeNote
            </span>
          </div>
          <div ref={deskWrap} className="h-[420px] w-full">
            <EmberMascot ref={deskMascot} mode="group" className="h-full w-full" />
          </div>
        </div>

        {/* 表单区 */}
        <div className="flex flex-1 items-center justify-center lg:p-10">
          <div className="w-full max-w-[380px]">
            {/* 移动端品牌头（含单个角色） */}
            <div className="mb-7 flex flex-col items-center text-center lg:hidden">
              <div ref={mobWrap} className="size-[120px]">
                <EmberMascot ref={mobMascot} mode="single" className="size-full" />
              </div>
              <h1 className="mt-1 font-serif text-[31px] leading-none font-medium text-[#33291F]">
                ForgeNote
              </h1>
              <p className="mt-2 break-keep text-[12px] leading-5 font-medium tracking-[0.06em] text-[#9c7a52]">
                {copy.login.categoryLine}
              </p>
              <p className="mt-1.5 text-[14px] leading-[1.5] text-[#6f6253]">
                {SLOGAN}
              </p>
            </div>

            {!configured ? (
              <div
                role="alert"
                className="rounded-[14px] border border-[#b53c28]/30 bg-[#b53c28]/[0.06] p-4 text-[13.5px] leading-6 text-[#9e3322] shadow-[0_1px_10px_rgba(120,90,50,0.06)]"
              >
                <p className="font-medium">{copy.login.notConfiguredTitle}</p>
                <p className="mt-1 text-[#9e3322]/80">
                  {copy.login.notConfiguredBody}
                </p>
              </div>
            ) : (
              <>
                {!(passwordState === "signupSent" || view === "resetSent") && (
                  <header className="mb-6 text-center lg:text-left">
                    <h2 className="font-serif text-[28px] leading-tight font-medium text-[#33291F]">
                      {viewTitle(view, isSignUp)}
                    </h2>
                    <p className="mt-2 text-[14px] leading-[1.5] text-[#8a7d6c]">
                      {viewSubtitle(view, isSignUp)}
                    </p>
                  </header>
                )}

                {error && (
                  <div
                    role="alert"
                    className="mb-4 flex items-start gap-2 rounded-[13px] border border-[#b53c28]/30 bg-[#b53c28]/[0.06] p-3 text-[13.5px] leading-5 text-[#9e3322]"
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
                    <button
                      type="button"
                      className={`mt-3 mr-4 text-[14px] ${LINK_CLASS}`}
                      onClick={() => {
                        resetTransient();
                        setView("resetRequest");
                      }}
                    >
                      {copy.reset.resend}
                    </button>
                    <button
                      type="button"
                      className="mt-3 text-[13px] font-medium text-[#9c7a52] underline-offset-4 hover:underline"
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
                      onFocus={() => setFocusField("email")}
                      onBlur={() => setFocusField(null)}
                      disabled={busy}
                    />
                    <Button type="submit" className={PRIMARY_BTN} disabled={!emailValid || busy}>
                      {resetState === "submitting" ? (
                        <LoaderCircle className="size-4 animate-spin" aria-hidden />
                      ) : null}
                      {resetState === "submitting"
                        ? copy.reset.submitting
                        : copy.reset.submit}
                    </Button>
                    <div className="text-center">
                      <button
                        type="button"
                        className="text-[13px] font-medium text-[#9c7a52] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25"
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
                  <div className="space-y-[18px]">
                    <form onSubmit={handlePasswordAuth} className="space-y-3">
                      <EmailField
                        value={email}
                        onChange={setEmail}
                        onFocus={() => setFocusField("email")}
                        onBlur={() => setFocusField(null)}
                        disabled={busy}
                      />
                      <div className="relative">
                        <label htmlFor="password" className="sr-only">
                          {copy.login.passwordLabel}
                        </label>
                        <input
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
                          onFocus={() => setFocusField("password")}
                          onBlur={() => setFocusField(null)}
                          disabled={busy}
                          className={`${FIELD_CLASS} pr-[46px]`}
                        />
                        <button
                          type="button"
                          aria-label={
                            showPassword
                              ? copy.login.hidePassword
                              : copy.login.showPassword
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

                      {!isSignUp && (
                        <div className="flex items-center justify-between pt-0.5">
                          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#6f6253] select-none">
                            <input
                              type="checkbox"
                              checked={remember}
                              onChange={(e) => setRemember(e.target.checked)}
                              className="size-4 accent-[#B5562B]"
                            />
                            {copy.login.rememberFor30Days}
                          </label>
                          <button
                            type="button"
                            className="text-[13px] font-medium text-[#B5562B] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#B5562B]/25"
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
                        disabled={!(emailValid && passwordValid) || busy}
                      >
                        {passwordState === "submitting" ? (
                          <LoaderCircle className="size-4 animate-spin" aria-hidden />
                        ) : null}
                        {passwordState === "submitting"
                          ? copy.login.submitting
                          : isSignUp
                            ? copy.login.signupSubmit
                            : copy.login.submit}
                      </Button>
                    </form>

                    <div className="flex items-center gap-3 text-xs text-[#a99578]">
                      <span className="h-px flex-1 bg-[#E3D8C7]" />
                      {copy.login.orDivider}
                      <span className="h-px flex-1 bg-[#E3D8C7]" />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full gap-2 rounded-[13px] border-[#E3D8C7] bg-transparent text-[14px] font-medium text-[#6f6253] hover:bg-[#FFFDF9]/65 hover:text-[#33291F] focus-visible:border-[#B5562B] focus-visible:ring-[#B5562B]/[0.28]"
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
                        : copy.login.google}
                    </Button>

                    <p className="text-center text-[13px] leading-6 text-[#9c7a52]">
                      {isSignUp
                        ? copy.login.hasAccountPrompt
                        : copy.login.noAccountPrompt}
                      <button
                        type="button"
                        className={`ml-1 ${LINK_CLASS}`}
                        disabled={busy}
                        onClick={() => {
                          resetTransient();
                          setView(isSignUp ? "signIn" : "signUp");
                        }}
                      >
                        {isSignUp
                          ? copy.login.toSignInLink
                          : copy.login.toSignUpLink}
                      </button>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function viewTitle(view: View, isSignUp: boolean): string {
  if (view === "resetRequest") return copy.reset.requestTitle;
  if (view === "resetSent") return copy.reset.sentTitle;
  return isSignUp ? copy.login.signupTitle : copy.login.signinTitle;
}
function viewSubtitle(view: View, isSignUp: boolean): string {
  if (view === "resetRequest") return copy.reset.requestSubtitle;
  if (view === "resetSent") return copy.reset.requestSubtitle;
  return isSignUp ? copy.login.signupSubtitle : copy.login.signinSubtitle;
}

function EmailField({
  value,
  onChange,
  onFocus,
  onBlur,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor="email" className="sr-only">
        {copy.login.emailLabel}
      </label>
      <input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={copy.login.emailPlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
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
      className="rounded-[14px] border border-[#E3D8C7] bg-[#FBF6EE] p-4 text-[14px] leading-6 shadow-[0_1px_10px_rgba(120,90,50,0.06)]"
    >
      <p className="font-medium text-[#33291F]">{title}</p>
      <p className="mt-1 text-[#6f6253]">
        {prefix}
        <span className="font-medium text-[#33291F]">{email}</span>
        {suffix}
      </p>
      <div>{children}</div>
    </div>
  );
}

function getAuthError(error: { message?: string; code?: string }): string {
  if (error.code === "email_not_confirmed") return copy.login.emailNotConfirmed;
  if (error.code === "invalid_credentials") return copy.login.invalidCredentials;
  return error.message || copy.login.authFailed;
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

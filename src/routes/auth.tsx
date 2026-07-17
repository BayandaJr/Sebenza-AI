import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RotatingTagline } from "@/components/rotating-tagline";
import { GoogleIcon } from "@/components/google-icon";
import { PasswordStrength, scorePassword } from "@/components/password-strength";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Sebenza AI" },
      { name: "description", content: "Sign in or create your Sebenza AI account." },
    ],
  }),
  component: AuthPage,
});

function safePath(next: string | undefined) {
  if (!next) return "/";
  try {
    if (next.startsWith("/") && !next.startsWith("//")) return next;
    const u = new URL(next, window.location.origin);
    if (u.origin === window.location.origin) return u.pathname + u.search;
  } catch {
    /* ignore */
  }
  return "/";
}

type View = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [view, setView] = useState<View>("signin");

  // Shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  // Signup extras
  const [name, setName] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Forgot
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: safePath(redirect), replace: true });
    });
  }, [navigate, redirect]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    // Mark first-run onboarding baseline so listeners can decide
    try {
      window.localStorage.setItem("sebenza-last-signin", String(Date.now()));
    } catch {
      /* ignore */
    }
    navigate({ to: safePath(redirect), replace: true });
  };

  const pwMatch = password.length > 0 && password === confirmPw;
  const pwMismatch = confirmPw.length > 0 && password !== confirmPw;
  const strongEnough = scorePassword(password).score >= 2;

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwMatch) return toast.error("Passwords do not match");
    if (!strongEnough) return toast.error("Please choose a stronger password");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. Welcome to Sebenza AI!");
    try {
      window.localStorage.setItem("sebenza-onboarding-pending", "1");
    } catch {
      /* ignore */
    }
    navigate({ to: safePath(redirect), replace: true });
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return toast.error(result.error.message);
    if (result.redirected) return;
    navigate({ to: safePath(redirect), replace: true });
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setForgotSent(true);
    toast.success("Reset link sent");
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/10 p-4">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl" />

      <Card className="glass-card relative z-10 w-full max-w-md animate-fade-in">
        <CardHeader className="space-y-3 text-center">
          <BrandLogo size={64} className="mx-auto" />
          <CardTitle className="text-2xl tracking-tight">Sebenza AI</CardTitle>
          <RotatingTagline className="text-sm text-muted-foreground min-h-[1.25rem]" />
        </CardHeader>

        <CardContent>
          {view === "forgot" ? (
            <div className="space-y-4">
              <button
                onClick={() => { setView("signin"); setForgotSent(false); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </button>

              {forgotSent ? (
                <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="font-semibold">Check your inbox</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We've sent a password reset link to <span className="font-medium text-foreground">{forgotEmail}</span>.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setView("signin")}>
                    Return to sign in
                  </Button>
                </div>
              ) : (
                <form onSubmit={sendReset} className="space-y-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    Enter the email associated with your account. We'll send you a secure link to reset your password.
                  </div>
                  <div>
                    <Label>Email address</Label>
                    <div className="relative mt-1.5">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending…" : "Send reset link"}
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                className="mb-4 w-full gap-2 transition-all hover:shadow-md"
                onClick={google}
                disabled={loading}
              >
                <GoogleIcon /> Continue with Google
              </Button>
              <div className="relative mb-4 text-center text-xs text-muted-foreground">
                <span className="bg-card px-2">or with email</span>
                <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
              </div>

              <Tabs value={view} onValueChange={(v) => setView(v as View)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={signIn} className="mt-4 space-y-3">
                    <div>
                      <Label>Email</Label>
                      <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showPw ? "text" : "password"}
                          required
                          minLength={6}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                          aria-label={showPw ? "Hide password" : "Show password"}
                        >
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                        <span className="text-muted-foreground">Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setView("forgot")}
                        className="text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in…" : "Sign in"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      New to Sebenza AI?{" "}
                      <button type="button" onClick={() => setView("signup")} className="text-primary hover:underline">
                        Create an account
                      </button>
                    </p>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={signUp} className="mt-4 space-y-3">
                    <div>
                      <Label>Full name</Label>
                      <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" />
                    </div>
                    <div>
                      <Label>Email address</Label>
                      <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showPw ? "text" : "password"}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                          aria-label={showPw ? "Hide password" : "Show password"}
                        >
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <PasswordStrength password={password} />
                    </div>
                    <div>
                      <Label>Confirm password</Label>
                      <div className="relative">
                        <Input
                          type={showConfirm ? "text" : "password"}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((s) => !s)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {pwMismatch && (
                        <p className="mt-1 text-[11px] text-red-500">Passwords do not match</p>
                      )}
                      {pwMatch && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-500">
                          <CheckCircle2 className="h-3 w-3" /> Passwords match
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || !pwMatch || !strongEnough}>
                      {loading ? "Creating account…" : "Create account"}
                    </Button>
                    <p className="text-center text-[11px] text-muted-foreground">
                      By continuing you agree to Sebenza AI's terms and privacy policy.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

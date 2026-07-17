import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordStrength, scorePassword } from "@/components/password-strength";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Sebenza AI" },
      { name: "description", content: "Set a new password for your Sebenza AI account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase auto-processes the recovery hash and emits PASSWORD_RECOVERY / SIGNED_IN.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        setReady(true);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const match = password.length > 0 && password === confirm;
  const strong = scorePassword(password).score >= 2;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return toast.error("Passwords do not match");
    if (!strong) return toast.error("Please choose a stronger password");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    setDone(true);
    toast.success("Password updated");
    setTimeout(() => navigate({ to: "/", replace: true }), 1500);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 p-4">
      <Card className="glass-card w-full max-w-md animate-fade-in">
        <CardHeader className="space-y-3 text-center">
          <BrandLogo size={56} className="mx-auto" />
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <ShieldCheck className="h-5 w-5 text-primary" /> Reset your password
          </CardTitle>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-3 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <p className="font-semibold">Password updated</p>
              <p className="text-sm text-muted-foreground">Redirecting you to your workspace…</p>
            </div>
          ) : !ready ? (
            <p className="text-center text-sm text-muted-foreground">
              Validating your reset link… If nothing happens, request a new link from the sign-in page.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label>New password</Label>
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>
              <div>
                <Label>Confirm password</Label>
                <Input
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                {confirm && !match && (
                  <p className="mt-1 text-[11px] text-red-500">Passwords do not match</p>
                )}
                {match && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-500">
                    <CheckCircle2 className="h-3 w-3" /> Passwords match
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading || !match || !strong}>
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

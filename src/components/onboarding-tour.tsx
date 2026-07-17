import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Mail, FileText, ListChecks, BookOpen,
  BarChart3, MessageSquare, User, Settings, Sparkles, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/brand-logo";

const STORAGE_KEY = "sebenza-onboarding-complete";
const RESTART_EVENT = "sebenza-restart-tutorial";

export function restartOnboarding() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(RESTART_EVENT));
}

type Step = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  path?: string;
};

const STEPS: Step[] = [
  { icon: Sparkles, title: "Welcome to Sebenza AI", body: "Your intelligent workplace productivity assistant. This quick tour introduces the features you'll use every day." },
  { icon: LayoutDashboard, title: "Dashboard Overview", body: "See your productivity metrics, weekly trends, and jump into quick actions from the main dashboard.", path: "/" },
  { icon: Mail, title: "Sebenza Mail", body: "Draft polished emails in seconds with tone, style, and personalization built in.", path: "/email" },
  { icon: FileText, title: "Sebenza Notes", body: "Turn raw meeting transcripts into structured notes, decisions, and action items.", path: "/meetings" },
  { icon: ListChecks, title: "Sebenza Planner", body: "Plan your day, week, and long-running work with an AI-powered task planner.", path: "/tasks" },
  { icon: BookOpen, title: "Sebenza Research", body: "Research any topic with cited summaries and structured briefs.", path: "/research" },
  { icon: BarChart3, title: "Sebenza Analytics", body: "Weekly reports, action tracking, and decision support that surface what matters.", path: "/report" },
  { icon: MessageSquare, title: "Sebenza Chat", body: "Talk to Sebenza with your voice — draft emails, tasks, and research hands-free.", path: "/voice" },
  { icon: User, title: "Your Profile", body: "Upload a profile photo, set your role, and tune how Sebenza personalizes responses for you.", path: "/profile" },
  { icon: Settings, title: "Customization", body: "Switch theme, pick an accent color, and choose the layout that fits your workflow. Restart this tour anytime from Settings.", path: "/settings" },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const maybeStart = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted || !data.session) return;
      try {
        if (!window.localStorage.getItem(STORAGE_KEY)) {
          setStep(0);
          setOpen(true);
        }
      } catch { /* ignore */ }
    };
    maybeStart();
    const restart = () => { setStep(0); setOpen(true); };
    window.addEventListener(RESTART_EVENT, restart);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") maybeStart();
    });
    return () => {
      mounted = false;
      window.removeEventListener(RESTART_EVENT, restart);
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!open) return null;

  const total = STEPS.length;
  const s = STEPS[step];
  const Icon = s.icon;
  const isLast = step === total - 1;

  const close = () => {
    try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
  };

  const next = () => {
    if (isLast) return close();
    setStep((i) => Math.min(i + 1, total - 1));
  };
  const prev = () => setStep((i) => Math.max(i - 1, 0));

  const visit = () => {
    if (s.path) navigate({ to: s.path });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="glass-card relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 shadow-2xl animate-scale-in">
        <button
          onClick={close}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-transparent to-primary-glow/10 p-6">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Getting started · Step {step + 1} of {total}
              </p>
              <p className="text-base font-semibold">Welcome tour</p>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-500"
              style={{ width: `${((step + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              {s.path && !isLast && (
                <Button variant="link" size="sm" className="mt-2 h-auto px-0" onClick={visit}>
                  Take me there →
                </Button>
              )}
            </div>
          </div>

          {isLast && (
            <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
              <p className="text-sm font-semibold">You're ready to start using Sebenza AI.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Automate. Organize. Succeed.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/30 px-6 py-3">
          <Button variant="ghost" size="sm" onClick={close}>
            Skip tutorial
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prev} disabled={step === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Button size="sm" onClick={next}>
              {isLast ? "Finish" : <>Next <ChevronRight className="ml-1 h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

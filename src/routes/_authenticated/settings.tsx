import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Palette, Layout } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { getExtendedProfile, updateExtendedProfile } from "@/lib/workspace.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{ title: "Settings · Sebenza AI" }, { name: "description", content: "Customize theme, accent, and layout." }],
  }),
  component: SettingsPage,
});

const ACCENTS = [
  { key: "blue", label: "Deep Blue", swatch: "#2563EB" },
  { key: "teal", label: "Teal", swatch: "#14B8A6" },
  { key: "gold", label: "Gold", swatch: "#F59E0B" },
  { key: "purple", label: "Purple", swatch: "#8B5CF6" },
  { key: "rose", label: "Rose", swatch: "#F43F5E" },
];

const DASHBOARDS = [
  { key: "grid", label: "Grid" },
  { key: "list", label: "List" },
  { key: "focus", label: "Focus" },
];
const SIDEBARS = [
  { key: "expanded", label: "Expanded" },
  { key: "compact", label: "Compact" },
];

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const qc = useQueryClient();
  const get = useServerFn(getExtendedProfile);
  const upd = useServerFn(updateExtendedProfile);
  const { data } = useQuery({ queryKey: ["ext-profile"], queryFn: () => get() });

  const [accent, setAccent] = useState("blue");
  const [dash, setDash] = useState("grid");
  const [sidebar, setSidebar] = useState("expanded");

  useEffect(() => {
    if (data?.profile) {
      setAccent(data.profile.accent_color ?? "blue");
      setDash(data.profile.dashboard_layout ?? "grid");
      setSidebar(data.profile.sidebar_layout ?? "expanded");
      applyAccent(data.profile.accent_color ?? "blue");
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      upd({ data: { accent_color: accent, dashboard_layout: dash, sidebar_layout: sidebar } }),
    onSuccess: () => {
      toast.success("Preferences saved");
      qc.invalidateQueries({ queryKey: ["ext-profile"] });
    },
  });

  const applyAccent = (a: string) => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-accent", a);
  };

  const reset = () => {
    ["metrics", "prompts", "actions", "learning-progress"].forEach((k) =>
      window.localStorage.removeItem(k),
    );
    window.dispatchEvent(new Event("metrics-updated"));
    toast.success("Workspace data reset");
  };

  return (
    <div>
      <PageHeader icon={SettingsIcon} title="Settings" description="Personalize Sebenza AI to fit your workflow." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Dark mode</Label>
                <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggle} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Palette className="h-4 w-4" /> Accent color</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => { setAccent(a.key); applyAccent(a.key); }}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${accent === a.key ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
                  >
                    <span className="h-4 w-4 rounded-full" style={{ background: a.swatch }} />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-1.5"><Layout className="h-4 w-4" /> Layout</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Dashboard layout</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DASHBOARDS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDash(d.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${dash === d.key ? "border-primary bg-primary/10" : "border-border"}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Sidebar layout</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SIDEBARS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setSidebar(d.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${sidebar === d.key ? "border-primary bg-primary/10" : "border-border"}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
              {save.isPending ? "Saving…" : "Save layout & accent"}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card md:col-span-2">
          <CardHeader><CardTitle>Data</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Reset local workspace demo data (metrics, prompts, actions, progress).</p>
            <Button variant="destructive" onClick={reset}>Reset workspace data</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

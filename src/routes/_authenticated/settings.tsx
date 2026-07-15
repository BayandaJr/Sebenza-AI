import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{ title: "Settings" }, { name: "description", content: "Configure preferences." }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const reset = () => {
    ["metrics", "prompts", "actions", "learning-progress"].forEach((k) =>
      window.localStorage.removeItem(k),
    );
    window.dispatchEvent(new Event("metrics-updated"));
    toast.success("Workspace data reset");
  };
  return (
    <div>
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        description="Personalize your AI workspace."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Dark mode</Label>
                <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggle} />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>AI defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Show confidence scores</Label>
                <p className="text-xs text-muted-foreground">Display confidence on every AI response</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-copy AI output</Label>
                <p className="text-xs text-muted-foreground">Copy responses to clipboard automatically</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card md:col-span-2">
          <CardHeader>
            <CardTitle>Data</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Reset local workspace data (metrics, prompts, actions, progress).
            </p>
            <Button variant="destructive" onClick={reset}>
              Reset workspace data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

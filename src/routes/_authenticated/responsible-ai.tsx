import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Eye, AlertTriangle, UserCheck, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { getMyRoles, getResponsibleAI, updateResponsibleAI } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/responsible-ai")({
  head: () => ({
    meta: [
      { title: "Responsible AI Center" },
      { name: "description", content: "Principles, disclaimers, and guardrails for using AI responsibly." },
    ],
  }),
  component: ResponsibleAIPage,
});

const items = [
  { icon: Eye, title: "Transparency Notice", body: "You are interacting with a generative AI system. Outputs are produced statistically from patterns in training data and may not reflect the most current facts." },
  { icon: AlertTriangle, title: "Bias Warning", body: "AI models can reflect and amplify societal biases present in their training data. Review outputs for stereotypes, unfair assumptions, or under-represented perspectives." },
  { icon: UserCheck, title: "Human Review Reminder", body: "Always keep a human in the loop for consequential decisions. Use AI to draft and analyze — not to replace judgment on people, money, safety, or compliance." },
  { icon: Lock, title: "Data Privacy Guidance", body: "Do not paste secrets, personal identifiers, or confidential customer data into prompts. Redact sensitive information before running AI analysis." },
];

function ResponsibleAIPage() {
  const qc = useQueryClient();
  const getRAI = useServerFn(getResponsibleAI);
  const getRoles = useServerFn(getMyRoles);
  const update = useServerFn(updateResponsibleAI);

  const roles = useQuery({ queryKey: ["my-roles"], queryFn: () => getRoles() });
  const rai = useQuery({ queryKey: ["rai"], queryFn: () => getRAI() });
  const isAdmin = roles.data?.isAdmin ?? false;

  const [form, setForm] = useState({ disclaimer: "", bias_notice: "", allow_export: true });
  useEffect(() => {
    if (rai.data) setForm({
      disclaimer: rai.data.disclaimer,
      bias_notice: rai.data.bias_notice,
      allow_export: rai.data.allow_export,
    });
  }, [rai.data]);

  const mut = useMutation({
    mutationFn: () => update({ data: form }),
    onSuccess: () => { toast.success("Policy updated"); qc.invalidateQueries({ queryKey: ["rai"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div>
      <PageHeader icon={Shield} title="Responsible AI Center" description="Our commitments and guidance for using AI responsibly at work." />

      <Alert className="glass-card mb-6 border-amber-500/40">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle>AI Disclaimer</AlertTitle>
        <AlertDescription>{rai.data?.disclaimer ?? "Loading…"}</AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((i) => (
          <Card key={i.title} className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <i.icon className="h-4 w-4" />
                </div>
                {i.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{i.body}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card mt-6">
        <CardHeader>
          <CardTitle>Organization policy {isAdmin ? "(admin editable)" : ""}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Disclaimer shown to users</Label>
            <Textarea rows={3} value={form.disclaimer} disabled={!isAdmin}
              onChange={(e) => setForm({ ...form, disclaimer: e.target.value })} />
          </div>
          <div>
            <Label>Bias notice</Label>
            <Textarea rows={3} value={form.bias_notice} disabled={!isAdmin}
              onChange={(e) => setForm({ ...form, bias_notice: e.target.value })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Allow AI output export</Label>
              <p className="text-xs text-muted-foreground">Turn off to hide copy/export buttons.</p>
            </div>
            <Switch checked={form.allow_export} disabled={!isAdmin}
              onCheckedChange={(v) => setForm({ ...form, allow_export: v })} />
          </div>
          {isAdmin && (
            <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
              {mut.isPending ? "Saving…" : "Save policy"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

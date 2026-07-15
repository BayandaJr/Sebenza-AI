import { createFileRoute } from "@tanstack/react-router";
import { Shield, Eye, AlertTriangle, UserCheck, Lock } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  {
    icon: Eye,
    title: "Transparency Notice",
    body: "You are interacting with a generative AI system. Outputs are produced statistically from patterns in training data and may not reflect the most current facts.",
  },
  {
    icon: AlertTriangle,
    title: "Bias Warning",
    body: "AI models can reflect and amplify societal biases present in their training data. Review outputs for stereotypes, unfair assumptions, or under-represented perspectives.",
  },
  {
    icon: UserCheck,
    title: "Human Review Reminder",
    body: "Always keep a human in the loop for consequential decisions. Use AI to draft and analyze — not to replace judgment on people, money, safety, or compliance.",
  },
  {
    icon: Lock,
    title: "Data Privacy Guidance",
    body: "Do not paste secrets, personal identifiers, or confidential customer data into prompts. Redact sensitive information before running AI analysis.",
  },
];

function ResponsibleAIPage() {
  return (
    <div>
      <PageHeader
        icon={Shield}
        title="Responsible AI Center"
        description="Our commitments and guidance for using AI responsibly at work."
      />

      <Alert className="glass-card mb-6 border-amber-500/40">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle>AI Disclaimer</AlertTitle>
        <AlertDescription>
          AI-generated content may contain inaccuracies. Users should verify information before making
          decisions.
        </AlertDescription>
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
          <CardTitle>Our AI Confidence System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Every AI response shows a confidence score from 0–100% and one of three badges:
            <span className="mx-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-600">High</span>
            <span className="mx-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-600">Medium</span>
            <span className="mx-1 rounded bg-rose-500/15 px-1.5 py-0.5 text-rose-600">Low</span>.
          </p>
          <p>
            Confidence reflects the model's self-reported certainty combined with linguistic uncertainty
            markers. Low confidence means: verify before acting.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

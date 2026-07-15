import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Send, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { AIOutput, LoadingOutput } from "@/components/ai-output";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateAI } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/followup")({
  head: () => ({
    meta: [
      { title: "AI Follow-Up Email Generator" },
      { name: "description", content: "Auto-draft follow-up and reminder emails from meetings." },
    ],
  }),
  component: FollowUpPage,
});

function FollowUpPage() {
  const run = useServerFn(generateAI);
  const [source, setSource] = useState(
    "Meeting: Q4 launch kickoff. Action items: Alex to finalize scope by Friday; Jordan to send components by Sep 30; Priya to draft campaign next Friday.",
  );
  const [result, setResult] = useState<{ text: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const gen = async () => {
    setLoading(true);
    try {
      const res = await run({
        data: {
          system:
            "You are an expert business writer. From meeting summary + action items, produce markdown with two emails: **Follow-Up Email** (Subject + Body) recapping decisions and confirming ownership, and **Reminder Email Version** (Subject + Body) for people who miss deadlines. Keep tone professional and concise.",
          prompt: source,
        },
      });
      setResult(res);
      toast.success("Follow-ups ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={Send}
        title="Follow-Up Email Generator"
        description="Turn meeting outcomes into ready-to-send follow-up and reminder emails."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={12} value={source} onChange={(e) => setSource(e.target.value)} />
            <Button onClick={gen} disabled={loading} className="w-full">
              <Wand2 className="mr-1 h-4 w-4" /> {loading ? "Drafting…" : "Generate Follow-Ups"}
            </Button>
          </CardContent>
        </Card>
        <div>
          {loading ? (
            <LoadingOutput />
          ) : result ? (
            <AIOutput
              title="Follow-Up Emails"
              text={result.text}
              confidence={result.confidence}
              onRegenerate={gen}
              loading={loading}
            />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Follow-up drafts appear here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

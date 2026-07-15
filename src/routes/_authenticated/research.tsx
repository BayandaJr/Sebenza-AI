import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BookOpen, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { AIOutput, LoadingOutput } from "@/components/ai-output";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { generateAI } from "@/lib/ai.functions";
import { bumpMetric } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant" },
      { name: "description", content: "Summarize research, extract insights, and explain simply." },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const run = useServerFn(generateAI);
  const [topic, setTopic] = useState("Impact of AI on knowledge worker productivity");
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ text: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const research = async () => {
    setLoading(true);
    try {
      const res = await run({
        data: {
          system:
            "You are a senior research analyst. Return markdown with sections: **Summary** (3 sentences), **Key Insights** (bulleted), **Main Findings**, **Recommendations**, **Simplified Explanation** (for a non-expert), **Key Takeaways** (5 bullets), **Read Time Estimate**, **Research Confidence Score** (0-100 with reasoning).",
          prompt: `Topic: ${topic}\n\nSource text (may be empty):\n${text || "(no source text — use general knowledge)"}`,
        },
      });
      setResult(res);
      bumpMetric("researchProcessed");
      toast.success("Research ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="AI Research Assistant"
        description="Turn topics or long articles into clear, actionable knowledge."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Research brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Topic</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Article or research text (optional)</Label>
              <Textarea
                rows={12}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste an article or leave blank to use general knowledge."
                className="mt-1.5"
              />
            </div>
            <Button onClick={research} disabled={loading} className="w-full">
              <Wand2 className="mr-1 h-4 w-4" /> {loading ? "Researching…" : "Run Research"}
            </Button>
          </CardContent>
        </Card>
        <div>
          {loading ? (
            <LoadingOutput />
          ) : result ? (
            <AIOutput
              title="Research Brief"
              text={result.text}
              confidence={result.confidence}
              onRegenerate={research}
              loading={loading}
            />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Findings will appear here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

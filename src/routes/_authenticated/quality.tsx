import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShieldCheck, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { generateAI } from "@/lib/ai.functions";
import { AIOutput, LoadingOutput } from "@/components/ai-output";

export const Route = createFileRoute("/_authenticated/quality")({
  head: () => ({
    meta: [
      { title: "AI Quality Checker" },
      { name: "description", content: "Analyze any AI output for clarity, professionalism, and accuracy." },
    ],
  }),
  component: QualityPage,
});

type Scores = { clarity: number; professionalism: number; accuracy: number; conciseness: number };

function extractScores(text: string): Scores {
  const grab = (k: string) => {
    const m = new RegExp(`${k}[^0-9]{0,10}(\\d{1,3})`, "i").exec(text);
    return m ? Math.min(100, Math.max(0, parseInt(m[1], 10))) : 80;
  };
  return {
    clarity: grab("clarity"),
    professionalism: grab("professionalism"),
    accuracy: grab("accuracy"),
    conciseness: grab("conciseness"),
  };
}

function QualityPage() {
  const run = useServerFn(generateAI);
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ text: string; confidence: number } | null>(null);
  const [scores, setScores] = useState<Scores | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!text.trim()) return toast.error("Paste text first");
    setLoading(true);
    try {
      const res = await run({
        data: {
          system:
            "You are a communication quality auditor. Analyze the provided text. Return markdown with numeric sections labelled exactly: **Clarity Score: X/100**, **Professionalism Score: X/100**, **Accuracy Confidence: X/100**, **Conciseness Score: X/100**, then a **Recommended Improvements** section (3-5 concrete suggestions).",
          prompt: text,
        },
      });
      setResult(res);
      setScores(extractScores(res.text));
      toast.success("Analysis ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        title="AI Quality Checker"
        description="Score any AI or human output on clarity, professionalism, accuracy, and conciseness."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Text to review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste an AI response or draft…" />
            <Button onClick={check} disabled={loading} className="w-full">
              <Wand2 className="mr-1 h-4 w-4" /> {loading ? "Analyzing…" : "Run Quality Check"}
            </Button>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {scores && (
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Clarity", scores.clarity],
                ["Professionalism", scores.professionalism],
                ["Accuracy", scores.accuracy],
                ["Conciseness", scores.conciseness],
              ].map(([k, v]) => (
                <Card key={k as string} className="glass-card">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="mt-1 text-2xl font-semibold">{v}%</p>
                    <Progress value={v as number} className="mt-2 h-1.5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {loading ? (
            <LoadingOutput />
          ) : result ? (
            <AIOutput title="Detailed Analysis" text={result.text} confidence={result.confidence} onRegenerate={check} loading={loading} />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Scores and recommendations appear here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { GraduationCap, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { AIOutput, LoadingOutput } from "@/components/ai-output";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { generateAI } from "@/lib/ai.functions";
import { useLocalStorage } from "@/lib/store";

export const Route = createFileRoute("/learning")({
  head: () => ({
    meta: [
      { title: "AI Learning Assistant" },
      { name: "description", content: "Build a 30-day plan for any skill you want to learn." },
    ],
  }),
  component: LearningPage,
});

function LearningPage() {
  const run = useServerFn(generateAI);
  const [skill, setSkill] = useState("Public speaking");
  const [level, setLevel] = useState("Beginner");
  const [result, setResult] = useState<{ text: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useLocalStorage<number>("learning-progress", 20);

  const gen = async () => {
    setLoading(true);
    try {
      const res = await run({
        data: {
          system:
            "You are a learning coach. For the given skill and current level, return a **30-Day Learning Plan** in markdown with: overview, **Weekly Milestones** (4 weeks), **Recommended Resources** (books, courses, videos), and a **Progress Tracker** checklist (daily bullets).",
          prompt: `Skill: ${skill}\nCurrent level: ${level}`,
        },
      });
      setResult(res);
      toast.success("Plan ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={GraduationCap}
        title="AI Learning Assistant"
        description="Build a personalized 30-day plan for any skill."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>What do you want to learn?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Skill</Label>
              <Input value={skill} onChange={(e) => setSkill(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Current level</Label>
              <Input value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1.5" />
            </div>
            <Button onClick={gen} disabled={loading} className="w-full">
              <Wand2 className="mr-1 h-4 w-4" /> {loading ? "Building plan…" : "Generate 30-Day Plan"}
            </Button>

            <div className="mt-6 rounded-lg border border-border/60 bg-background/60 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setProgress(Math.max(0, progress - 10))}>
                  -10%
                </Button>
                <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>
                  +10%
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <div>
          {loading ? (
            <LoadingOutput />
          ) : result ? (
            <AIOutput title="Your Learning Plan" text={result.text} confidence={result.confidence} onRegenerate={gen} loading={loading} />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Your plan will appear here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

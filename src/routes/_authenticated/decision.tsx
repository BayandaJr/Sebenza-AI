import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Scale, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { AIOutput, LoadingOutput } from "@/components/ai-output";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateAI } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/decision")({
  head: () => ({
    meta: [
      { title: "AI Decision Support" },
      { name: "description", content: "Executive-format pros, cons, risks, and recommendations." },
    ],
  }),
  component: DecisionPage,
});

function DecisionPage() {
  const run = useServerFn(generateAI);
  const [problem, setProblem] = useState(
    "Should we build our own analytics platform or buy a third-party solution?",
  );
  const [result, setResult] = useState<{ text: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const gen = async () => {
    setLoading(true);
    try {
      const res = await run({
        data: {
          system:
            "You are a senior strategy consultant. For the workplace problem, return an executive decision memo in markdown with sections: **Situation**, **Pros**, **Cons**, **Opportunities**, **Risks**, **Recommendation** (bold, one clear choice with rationale).",
          prompt: problem,
        },
      });
      setResult(res);
      toast.success("Decision memo ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={Scale}
        title="AI Decision Support"
        description="Frame any tough choice as an executive decision memo."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Decision to make</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={10} value={problem} onChange={(e) => setProblem(e.target.value)} />
            <Button onClick={gen} disabled={loading} className="w-full">
              <Wand2 className="mr-1 h-4 w-4" /> {loading ? "Thinking…" : "Analyze Decision"}
            </Button>
          </CardContent>
        </Card>
        <div>
          {loading ? (
            <LoadingOutput />
          ) : result ? (
            <AIOutput title="Executive Decision Memo" text={result.text} confidence={result.confidence} onRegenerate={gen} loading={loading} />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Analysis will appear here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { FileBarChart, Wand2, Printer } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { AIOutput, LoadingOutput } from "@/components/ai-output";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateAI } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/report")({
  head: () => ({
    meta: [
      { title: "Weekly Report Generator" },
      { name: "description", content: "Combine outputs into a weekly productivity report." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const run = useServerFn(generateAI);
  const [meetings, setMeetings] = useState(
    "Q4 kickoff — decisions on scope and timeline\nDesign review — approved new brand system",
  );
  const [tasks, setTasks] = useState(
    "Completed: budget review, board slides v1, hired 2 engineers\nIn progress: launch campaign",
  );
  const [research, setResearch] = useState("AI productivity trends briefing shared with team");
  const [result, setResult] = useState<{ text: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const gen = async () => {
    setLoading(true);
    try {
      const res = await run({
        data: {
          system:
            "You are a chief of staff. Produce a **Weekly Productivity Report** in markdown with sections: **Work Completed**, **Major Decisions**, **Action Items** (with owners), **Productivity Insights**, **Recommendations for Next Week**. Use tables where helpful.",
          prompt: `Meetings:\n${meetings}\n\nTasks:\n${tasks}\n\nResearch:\n${research}`,
        },
      });
      setResult(res);
      toast.success("Report ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={FileBarChart}
        title="Weekly Report Generator"
        description="Compile a shareable productivity report and export to PDF."
        actions={
          result && (
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-1 h-4 w-4" /> Export PDF
            </Button>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card no-print">
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Meeting outputs</label>
              <Textarea rows={4} value={meetings} onChange={(e) => setMeetings(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Completed tasks</label>
              <Textarea rows={4} value={tasks} onChange={(e) => setTasks(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Research</label>
              <Textarea rows={3} value={research} onChange={(e) => setResearch(e.target.value)} />
            </div>
            <Button onClick={gen} disabled={loading} className="w-full">
              <Wand2 className="mr-1 h-4 w-4" /> {loading ? "Compiling…" : "Generate Report"}
            </Button>
          </CardContent>
        </Card>
        <div>
          {loading ? (
            <LoadingOutput />
          ) : result ? (
            <AIOutput
              title="Weekly Productivity Report"
              text={result.text}
              confidence={result.confidence}
              onRegenerate={gen}
              loading={loading}
            />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Report will appear here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

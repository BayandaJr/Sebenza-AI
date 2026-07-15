import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { FileText, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { AIOutput, LoadingOutput } from "@/components/ai-output";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateAI } from "@/lib/ai.functions";
import { bumpMetric } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer" },
      { name: "description", content: "Turn raw meeting notes into structured executive summaries." },
    ],
  }),
  component: MeetingsPage,
});

const sample = `Attendees: Sarah (PM), Alex (Eng), Jordan (Design), Priya (Marketing)
- Kickoff for Q4 launch, timeline agreed: dev freeze Oct 20, beta Nov 5, GA Nov 20
- Alex: needs 2 more engineers or scope must reduce
- Jordan: new brand system ready; will hand off components by Sep 30
- Priya: campaign draft next Friday; wants exec quotes by Oct 5
- Decision: launch will focus on enterprise segment only
- Open risk: dependency on payment provider migration`;

function MeetingsPage() {
  const run = useServerFn(generateAI);
  const [notes, setNotes] = useState(sample);
  const [result, setResult] = useState<{ text: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const summarize = async () => {
    if (!notes.trim()) return toast.error("Paste meeting notes first");
    setLoading(true);
    try {
      const res = await run({
        data: {
          system:
            "You are an executive assistant. From raw meeting notes, return markdown with sections: **Executive Summary**, **Key Decisions**, **Discussion Highlights**, **Action Items** (with owners), **Deadlines**, **Responsible Individuals**, **Meeting Importance Rating** (1-5 with reason), **Priority Level** (Low/Medium/High).",
          prompt: notes,
        },
      });
      setResult(res);
      bumpMetric("meetingsSummarized");
      toast.success("Summary ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={FileText}
        title="Meeting Notes Summarizer"
        description="Paste your notes and get an executive-ready summary."
        actions={
          result && (
            <Button variant="outline" onClick={() => window.print()}>
              Export Summary
            </Button>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Meeting notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Raw notes</Label>
            <Textarea rows={16} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button onClick={summarize} disabled={loading} className="w-full">
              <Wand2 className="mr-1 h-4 w-4" /> {loading ? "Summarizing…" : "Summarize Meeting"}
            </Button>
          </CardContent>
        </Card>
        <div>
          {loading ? (
            <LoadingOutput />
          ) : result ? (
            <AIOutput
              title="Meeting Summary"
              text={result.text}
              confidence={result.confidence}
              onRegenerate={summarize}
              loading={loading}
            />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Summary will appear here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

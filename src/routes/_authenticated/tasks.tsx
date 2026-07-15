import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ListChecks, Wand2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { AIOutput, LoadingOutput } from "@/components/ai-output";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateAI } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner" },
      { name: "description", content: "Prioritize your tasks and build a smart daily plan." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const run = useServerFn(generateAI);
  const [tasks, setTasks] = useState<string[]>([
    "Prepare board presentation slides",
    "Review Q3 budget",
    "Reply to partner emails",
    "1:1 with new hire",
    "Fix production bug in reports",
  ]);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<{ text: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const add = () => {
    if (!draft.trim()) return;
    setTasks((t) => [...t, draft.trim()]);
    setDraft("");
  };

  const plan = async () => {
    if (!tasks.length) return toast.error("Add tasks first");
    setLoading(true);
    try {
      const res = await run({
        data: {
          system:
            "You are a productivity coach. Given a list of tasks, return markdown with: **Prioritized Tasks** (table with Task | Priority [High/Med/Low] | Urgency | Importance | Est. Time), **Best Order of Task Completion** (numbered), **Suggested Daily Schedule** (time-blocked), **Suggested Weekly Schedule** (day-by-day), **Productivity Tips** (3 bullets).",
          prompt: `Tasks:\n- ${tasks.join("\n- ")}`,
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
        icon={ListChecks}
        title="AI Task Planner"
        description="Enter your tasks and let AI build a prioritized daily plan."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Your tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="Add a task…"
              />
              <Button onClick={add} variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="space-y-2">
              {tasks.map((t, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
                >
                  <span>{t}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTasks(tasks.filter((_, ix) => ix !== i))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button onClick={plan} disabled={loading} className="w-full">
              <Wand2 className="mr-1 h-4 w-4" /> {loading ? "Planning…" : "Generate Plan"}
            </Button>
          </CardContent>
        </Card>
        <div>
          {loading ? (
            <LoadingOutput />
          ) : result ? (
            <AIOutput
              title="Your AI Plan"
              text={result.text}
              confidence={result.confidence}
              onRegenerate={plan}
              loading={loading}
            />
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

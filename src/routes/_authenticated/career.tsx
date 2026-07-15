import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Briefcase, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { AIOutput, LoadingOutput } from "@/components/ai-output";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateAI } from "@/lib/ai.functions";

export const Route = createFileRoute("/career")({
  head: () => ({
    meta: [
      { title: "Career Assistant" },
      { name: "description", content: "AI-powered CV, cover letter, LinkedIn, and interview prep." },
    ],
  }),
  component: CareerPage,
});

function CareerPage() {
  const run = useServerFn(generateAI);
  const [tab, setTab] = useState("cv");
  const [input, setInput] = useState("");
  const [role, setRole] = useState("Senior Product Manager at a fintech scale-up");
  const [result, setResult] = useState<{ text: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const systems: Record<string, string> = {
    cv: "You are a career coach. Given a CV or work history, return an improved version in markdown with a **Summary of Improvements** section and the rewritten **CV**.",
    cover: "You are an expert cover-letter writer. Write a personalized cover letter (markdown) for the target role.",
    linkedin: "You are a personal branding expert. Suggest 5 LinkedIn headline options with rationale, then a suggested **About** section.",
    interview: "You are an interview coach. Return 8 common questions for the target role, model answers, and 3 STAR-format example responses.",
  };
  const labels: Record<string, string> = {
    cv: "CV / work history",
    cover: "Your background",
    linkedin: "Current role + strengths",
    interview: "Your background",
  };

  const gen = async () => {
    setLoading(true);
    try {
      const res = await run({
        data: {
          system: systems[tab],
          prompt: `Target role: ${role}\n\nInput:\n${input || "(minimal input — infer sensibly)"}`,
        },
      });
      setResult(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={Briefcase}
        title="Career Assistant"
        description="Upgrade your CV, cover letter, LinkedIn, and interview prep with AI."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Career tools</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => { setTab(v); setResult(null); }}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cv">CV</TabsTrigger>
                <TabsTrigger value="cover">Cover</TabsTrigger>
                <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
                <TabsTrigger value="interview">Interview</TabsTrigger>
              </TabsList>
              <TabsContent value={tab} className="space-y-3 pt-4">
                <div>
                  <Label>Target role</Label>
                  <Input value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>{labels[tab]}</Label>
                  <Textarea rows={10} value={input} onChange={(e) => setInput(e.target.value)} className="mt-1.5" />
                </div>
                <Button onClick={gen} disabled={loading} className="w-full">
                  <Wand2 className="mr-1 h-4 w-4" /> {loading ? "Generating…" : "Generate"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <div>
          {loading ? (
            <LoadingOutput />
          ) : result ? (
            <AIOutput title="Result" text={result.text} confidence={result.confidence} onRegenerate={gen} loading={loading} />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Your career output will appear here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

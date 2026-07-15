import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Mail, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { AIOutput, LoadingOutput } from "@/components/ai-output";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateAI } from "@/lib/ai.functions";
import { bumpMetric } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator · AI Workplace" },
      { name: "description", content: "Generate professional emails with AI in seconds." },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const run = useServerFn(generateAI);
  const [purpose, setPurpose] = useState("Follow up on our proposal from last week");
  const [audience, setAudience] = useState("Client");
  const [tone, setTone] = useState("Professional");
  const [result, setResult] = useState<{ text: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!purpose.trim()) return toast.error("Please describe the email purpose");
    setLoading(true);
    try {
      const res = await run({
        data: {
          system:
            "You are an expert business writer. Produce a concise, high-quality email tailored to the audience and tone. Return markdown with sections: **Subject Line**, **Email Body**, **Suggested Follow-Up Actions** (bulleted), and **Quality Score** (0-100 with 1-line justification).",
          prompt: `Purpose: ${purpose}\nAudience: ${audience}\nTone: ${tone}`,
        },
      });
      setResult(res);
      bumpMetric("emailsGenerated");
      toast.success("Email generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={Mail}
        title="Smart Email Generator"
        description="Draft polished emails tuned for the right audience and tone."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Compose brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email purpose</Label>
              <Textarea
                rows={4}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="What is this email about?"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Client", "Manager", "Team", "Investor", "Vendor"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Formal", "Professional", "Friendly", "Persuasive"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Optional context / recipient</Label>
              <Input placeholder="e.g. Sarah, VP Marketing at Acme" className="mt-1.5" />
            </div>
            <Button onClick={generate} disabled={loading} className="w-full">
              <Wand2 className="mr-1 h-4 w-4" />
              {loading ? "Generating…" : "Generate Email"}
            </Button>
          </CardContent>
        </Card>
        <div>
          {loading ? (
            <LoadingOutput />
          ) : result ? (
            <AIOutput
              title="Generated Email"
              text={result.text}
              confidence={result.confidence}
              onRegenerate={generate}
              loading={loading}
            />
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Your generated email will appear here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

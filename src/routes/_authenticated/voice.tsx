import { createFileRoute } from "@tanstack/react-router";
import { Mic } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoicePanel } from "@/components/voice-assistant";

export const Route = createFileRoute("/_authenticated/voice")({
  head: () => ({
    meta: [
      { title: "Sebenza Voice · Sebenza AI" },
      { name: "description", content: "Voice-first assistant for emails, tasks, research, and meeting summaries." },
    ],
  }),
  component: VoicePage,
});

function VoicePage() {
  return (
    <div>
      <PageHeader
        icon={Mic}
        title="Sebenza Voice"
        description="Speak your intent — draft emails, create tasks, request research, or summarize meetings hands-free."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <Card className="glass-card">
          <CardHeader><CardTitle>Voice Console</CardTitle></CardHeader>
          <CardContent>
            <VoicePanel compact />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader><CardTitle>Try saying…</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• "Write an email to my manager asking for a project extension."</p>
            <p>• "Create a task list to prepare tomorrow's client demo."</p>
            <p>• "Research the latest trends in African fintech."</p>
            <p>• "Summarize the meeting where we discussed Q4 targets."</p>
            <p className="text-xs pt-2">Voice input uses your browser's speech recognition; playback uses your device's voice synthesis. Both work best in Chrome or Edge.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Mic, MicOff, Volume2, VolumeX, Send, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSpeechRecognition, speak, stopSpeaking, classifyVoiceCommand } from "@/lib/voice";
import { generateAI } from "@/lib/ai.functions";
import { logPrompt, saveItem } from "@/lib/workspace.functions";

const KIND_BY_TYPE = {
  email: "saved_emails",
  meeting: "saved_meetings",
  research: "saved_research",
  general: null,
  task: null,
} as const;

export function VoiceAssistantButton() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open Sebenza Voice">
          <Mic className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Sebenza Voice
          </SheetTitle>
        </SheetHeader>
        <VoicePanel />
      </SheetContent>
    </Sheet>
  );
}

export function VoicePanel({ compact = false }: { compact?: boolean }) {
  const { supported, listening, transcript, interim, start, stop, reset } = useSpeechRecognition();
  const run = useServerFn(generateAI);
  const log = useServerFn(logPrompt);
  const save = useServerFn(saveItem);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [manual, setManual] = useState("");

  const input = (transcript + (interim ? " " + interim : "")).trim() || manual.trim();

  const submit = async () => {
    if (!input) return toast.error("Say or type something first");
    const kind = classifyVoiceCommand(input);
    setLoading(true);
    setResponse("");
    try {
      const systemByKind: Record<string, string> = {
        email: "You are an executive email writer. Draft a concise, professional email based on the voice request. Include Subject and Body sections in markdown.",
        task: "You are a task planner. Turn the voice request into a clear, actionable checklist with priorities and time estimates in markdown.",
        research: "You are a research assistant. Provide a concise briefing with 3-5 key findings and sources considerations. Use markdown.",
        meeting: "You are a meeting note-taker. Produce a structured summary with Key Points, Decisions, and Action Items in markdown.",
        general: "You are Sebenza AI, a helpful workplace assistant. Reply concisely in markdown.",
      };
      const res = await run({ data: { system: systemByKind[kind], prompt: input } });
      setResponse(res.text);
      await log({ data: { feature: `voice:${kind}`, prompt: input, response: res.text } }).catch(() => {});
      const savedKind = KIND_BY_TYPE[kind];
      if (savedKind) {
        await save({
          data: { kind: savedKind, title: input.slice(0, 80), content: res.text, meta: { source: "voice" } },
        }).catch(() => {});
      }
      toast.success(`Handled as ${kind}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const playResponse = () => {
    if (!response) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    speak(response);
    setSpeaking(true);
    setTimeout(() => setSpeaking(false), Math.max(4000, response.length * 60));
  };

  return (
    <div className={compact ? "space-y-3" : "mt-4 space-y-4"}>
      {!supported && (
        <p className="text-sm text-amber-600">
          Voice input isn't supported in this browser. Try Chrome or Edge, or type your request below.
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button
          onClick={listening ? stop : start}
          disabled={!supported}
          variant={listening ? "destructive" : "default"}
          className="flex-1"
        >
          {listening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
          {listening ? "Stop listening" : "Start listening"}
        </Button>
        <Button variant="outline" onClick={reset} disabled={loading}>
          Clear
        </Button>
      </div>
      {listening && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          Listening…
        </div>
      )}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Transcript</label>
        <Textarea
          rows={4}
          value={transcript + (interim ? " " + interim : "")}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Say something like: 'Draft an email to my team about tomorrow's launch.'"
          className="mt-1.5"
        />
        {input && (
          <div className="mt-2">
            <Badge variant="outline">Detected: {classifyVoiceCommand(input)}</Badge>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={submit} disabled={loading || !input} className="flex-1">
          <Send className="mr-2 h-4 w-4" /> {loading ? "Working…" : "Send to Sebenza AI"}
        </Button>
        <Button variant="outline" onClick={playResponse} disabled={!response}>
          {speaking ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}
          {speaking ? "Stop" : "Play"}
        </Button>
      </div>
      {response && (
        <div className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm whitespace-pre-wrap max-h-[40vh] overflow-auto">
          {response}
        </div>
      )}
    </div>
  );
}

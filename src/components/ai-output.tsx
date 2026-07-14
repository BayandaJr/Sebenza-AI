import { Copy, RefreshCw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const label = confidence >= 85 ? "High Confidence" : confidence >= 70 ? "Medium Confidence" : "Low Confidence";
  const color =
    confidence >= 85
      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
      : confidence >= 70
        ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
        : "bg-rose-500/15 text-rose-600 border-rose-500/30";
  return (
    <Badge variant="outline" className={`${color} font-medium`}>
      <Sparkles className="mr-1 h-3 w-3" />
      {label} · {confidence}%
    </Badge>
  );
}

export function AIOutput({
  title = "AI Response",
  text,
  confidence,
  onRegenerate,
  loading,
  extra,
}: {
  title?: string;
  text: string;
  confidence?: number;
  onRegenerate?: () => void;
  loading?: boolean;
  extra?: React.ReactNode;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {typeof confidence === "number" && <ConfidenceBadge confidence={confidence} />}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={copy} disabled={!text}>
            <Copy className="mr-1 h-4 w-4" /> Copy
          </Button>
          {onRegenerate && (
            <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={loading}>
              <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Regenerate
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {typeof confidence === "number" && (
          <div className="mb-3">
            <Progress value={confidence} className="h-1.5" />
          </div>
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-4 prose-p:leading-relaxed prose-pre:bg-muted">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
        {extra}
      </CardContent>
    </Card>
  );
}

export function LoadingOutput() {
  return (
    <Card className="glass-card">
      <CardContent className="flex items-center gap-3 py-8">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
          <div className="absolute inset-2 rounded-full bg-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-medium">Thinking…</span>
          <span className="text-sm text-muted-foreground">Generating a high-quality response</span>
        </div>
      </CardContent>
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Mail, FileText, BookOpen, FileBarChart, History, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listItems, deleteItem, listPromptHistory } from "@/lib/workspace.functions";

export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({
    meta: [
      { title: "My Workspace · Sebenza AI" },
      { name: "description", content: "Your saved emails, meeting summaries, research reports, and prompt history." },
    ],
  }),
  component: WorkspacePage,
});

const TABS = [
  { key: "saved_emails", label: "Emails", icon: Mail },
  { key: "saved_meetings", label: "Meetings", icon: FileText },
  { key: "saved_research", label: "Research", icon: BookOpen },
  { key: "saved_reports", label: "Reports", icon: FileBarChart },
] as const;

function ItemList({ kind }: { kind: "saved_emails" | "saved_meetings" | "saved_research" | "saved_reports" }) {
  const qc = useQueryClient();
  const list = useServerFn(listItems);
  const del = useServerFn(deleteItem);
  const { data, isLoading } = useQuery({
    queryKey: ["workspace", kind],
    queryFn: () => list({ data: { kind } }),
  });
  const mut = useMutation({
    mutationFn: (id: string) => del({ data: { kind, id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["workspace", kind] });
    },
  });

  if (isLoading) return <p className="p-4 text-sm text-muted-foreground">Loading…</p>;
  if (!data || data.length === 0)
    return <p className="p-4 text-sm text-muted-foreground">Nothing saved yet. Use the Save button on generated output.</p>;

  return (
    <div className="space-y-3">
      {data.map((row) => (
        <Card key={row.id} className="glass-card">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">{row.title || "Untitled"}</CardTitle>
              <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => mut.mutate(row.id)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap max-h-48 overflow-auto">{row.content}</pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PromptHistoryList() {
  const list = useServerFn(listPromptHistory);
  const { data, isLoading } = useQuery({ queryKey: ["prompt-history"], queryFn: () => list() });
  if (isLoading) return <p className="p-4 text-sm text-muted-foreground">Loading…</p>;
  if (!data || data.length === 0)
    return <p className="p-4 text-sm text-muted-foreground">No prompts logged yet.</p>;
  return (
    <div className="space-y-3">
      {data.map((row) => (
        <Card key={row.id} className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{row.feature}</CardTitle>
            <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{row.prompt}</p>
            {row.response && (
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-auto">{row.response}</pre>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WorkspacePage() {
  return (
    <div>
      <PageHeader
        icon={Briefcase}
        title="My Workspace"
        description="Everything you've saved with Sebenza AI, in one place."
      />
      <Tabs defaultValue="saved_emails">
        <TabsList className="mb-4 flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              <t.icon className="mr-1.5 h-4 w-4" />
              {t.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="history">
            <History className="mr-1.5 h-4 w-4" />
            Prompt History
          </TabsTrigger>
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            <ItemList kind={t.key} />
          </TabsContent>
        ))}
        <TabsContent value="history">
          <PromptHistoryList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

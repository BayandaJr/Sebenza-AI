import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Library, Plus, Search, Star, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/prompts")({
  head: () => ({
    meta: [
      { title: "Prompt Library" },
      { name: "description", content: "Save, categorize, and reuse your best prompts." },
    ],
  }),
  component: PromptsPage,
});

type Prompt = {
  id: string;
  title: string;
  body: string;
  category: string;
  favorite: boolean;
  lastUsed?: number;
};

const CATEGORIES = ["Email Writing", "Meeting Management", "Research", "Productivity", "Project Planning"];

const seed: Prompt[] = [
  {
    id: "1",
    title: "Formal client follow-up",
    body: "Write a professional follow-up email to a client thanking them for the meeting and reiterating next steps.",
    category: "Email Writing",
    favorite: true,
  },
  {
    id: "2",
    title: "Standup summarizer",
    body: "Summarize this daily standup and highlight blockers.",
    category: "Meeting Management",
    favorite: false,
  },
  {
    id: "3",
    title: "Competitive analysis",
    body: "Compare our product to top 3 competitors and highlight key differentiators.",
    category: "Research",
    favorite: false,
  },
];

function PromptsPage() {
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>("prompts", seed);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [newCat, setNewCat] = useState(CATEGORIES[0]);

  const filtered = useMemo(
    () =>
      prompts
        .filter((p) => (cat === "All" ? true : p.category === cat))
        .filter(
          (p) =>
            p.title.toLowerCase().includes(q.toLowerCase()) ||
            p.body.toLowerCase().includes(q.toLowerCase()),
        )
        .sort((a, b) => Number(b.favorite) - Number(a.favorite)),
    [prompts, q, cat],
  );

  const recent = prompts
    .filter((p) => p.lastUsed)
    .sort((a, b) => (b.lastUsed ?? 0) - (a.lastUsed ?? 0))
    .slice(0, 3);

  const add = () => {
    if (!title.trim() || !body.trim()) return toast.error("Title & body required");
    setPrompts([
      { id: crypto.randomUUID(), title, body, category: newCat, favorite: false },
      ...prompts,
    ]);
    setTitle("");
    setBody("");
    toast.success("Prompt saved");
  };

  const use = async (p: Prompt) => {
    await navigator.clipboard.writeText(p.body);
    setPrompts(prompts.map((x) => (x.id === p.id ? { ...x, lastUsed: Date.now() } : x)));
    toast.success("Copied — paste anywhere");
  };

  return (
    <div>
      <PageHeader
        icon={Library}
        title="Prompt Library"
        description="Save, categorize, and reuse your best prompts."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div>
          <Card className="glass-card mb-4">
            <CardContent className="flex flex-wrap items-center gap-2 p-4">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search prompts…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((p) => (
              <Card key={p.id} className="glass-card">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setPrompts(prompts.map((x) => (x.id === p.id ? { ...x, favorite: !x.favorite } : x)))
                      }
                    >
                      <Star className={`h-4 w-4 ${p.favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="mt-1 w-fit">
                    {p.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-3">{p.body}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => use(p)}>
                      <Copy className="mr-1 h-3 w-3" /> Use
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPrompts(prompts.filter((x) => x.id !== p.id))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <Card className="glass-card md:col-span-2">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  No prompts found.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Add new prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder="Prompt text…" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
              <Select value={newCat} onValueChange={setNewCat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={add} className="w-full">
                <Plus className="mr-1 h-4 w-4" /> Save prompt
              </Button>
            </CardContent>
          </Card>

          {recent.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Recently used</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {recent.map((p) => (
                  <div key={p.id} className="truncate rounded-md bg-background/60 px-3 py-2">
                    {p.title}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

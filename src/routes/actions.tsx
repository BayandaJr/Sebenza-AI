import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KanbanSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage, bumpMetric } from "@/lib/store";

export const Route = createFileRoute("/actions")({
  head: () => ({
    meta: [
      { title: "Action Tracker" },
      { name: "description", content: "Track meeting action items on a lightweight kanban." },
    ],
  }),
  component: ActionsPage,
});

type Status = "Not Started" | "In Progress" | "Completed";
type Action = { id: string; task: string; assignee: string; due: string; status: Status };

const seed: Action[] = [
  { id: "1", task: "Draft launch campaign", assignee: "Priya", due: "2026-07-25", status: "In Progress" },
  { id: "2", task: "Finalize scope doc", assignee: "Alex", due: "2026-07-20", status: "Not Started" },
  { id: "3", task: "Design handoff", assignee: "Jordan", due: "2026-07-18", status: "Completed" },
];

const cols: Status[] = ["Not Started", "In Progress", "Completed"];

function ActionsPage() {
  const [items, setItems] = useLocalStorage<Action[]>("actions", seed);
  const [task, setTask] = useState("");
  const [assignee, setAssignee] = useState("");
  const [due, setDue] = useState("");

  const add = () => {
    if (!task.trim()) return toast.error("Task required");
    setItems([
      { id: crypto.randomUUID(), task, assignee: assignee || "Unassigned", due, status: "Not Started" },
      ...items,
    ]);
    setTask("");
    setAssignee("");
    setDue("");
  };

  const setStatus = (id: string, s: Status) => {
    const wasCompleted = items.find((i) => i.id === id)?.status === "Completed";
    setItems(items.map((i) => (i.id === id ? { ...i, status: s } : i)));
    if (s === "Completed" && !wasCompleted) bumpMetric("tasksCompleted");
  };

  return (
    <div>
      <PageHeader
        icon={KanbanSquare}
        title="Action Tracker"
        description="Turn meeting action items into a shared board of work."
      />

      <Card className="glass-card mb-6">
        <CardContent className="flex flex-wrap items-end gap-2 p-4">
          <div className="flex-1 min-w-[180px]">
            <Input placeholder="Task" value={task} onChange={(e) => setTask(e.target.value)} />
          </div>
          <Input
            placeholder="Assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-40"
          />
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-44" />
          <Button onClick={add}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {cols.map((c) => (
          <Card key={c} className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{c}</span>
                <Badge variant="secondary">{items.filter((i) => i.status === c).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items
                .filter((i) => i.status === c)
                .map((i) => (
                  <div key={i.id} className="rounded-lg border border-border/60 bg-background/60 p-3">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{i.task}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setItems(items.filter((x) => x.id !== i.id))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {i.assignee} · {i.due || "no due date"}
                    </p>
                    <Select value={i.status} onValueChange={(v) => setStatus(i.id, v as Status)}>
                      <SelectTrigger className="mt-2 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cols.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              {items.filter((i) => i.status === c).length === 0 && (
                <p className="rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                  No items
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

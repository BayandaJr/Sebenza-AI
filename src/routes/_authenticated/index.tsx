import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Mail,
  FileText,
  ListChecks,
  BookOpen,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { defaultMetrics, type Metrics } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard · AI Workplace Assistant Pro" },
      {
        name: "description",
        content: "Your enterprise AI productivity dashboard: metrics, insights, and quick actions.",
      },
    ],
  }),
  component: Dashboard,
});

const weekly = [
  { day: "Mon", tasks: 6, hours: 1.2 },
  { day: "Tue", tasks: 9, hours: 1.8 },
  { day: "Wed", tasks: 4, hours: 0.9 },
  { day: "Thu", tasks: 11, hours: 2.1 },
  { day: "Fri", tasks: 8, hours: 1.5 },
  { day: "Sat", tasks: 3, hours: 0.4 },
  { day: "Sun", tasks: 2, hours: 0.3 },
];

const quickActions = [
  { title: "Draft Email", to: "/email", icon: Mail, color: "from-blue-500 to-indigo-500" },
  { title: "Summarize Meeting", to: "/meetings", icon: FileText, color: "from-violet-500 to-purple-500" },
  { title: "Plan My Day", to: "/tasks", icon: ListChecks, color: "from-emerald-500 to-teal-500" },
  { title: "Research Topic", to: "/research", icon: BookOpen, color: "from-amber-500 to-orange-500" },
] as const;

function Dashboard() {
  const [m, setM] = useState<Metrics>(defaultMetrics);
  useEffect(() => {
    const load = () => {
      try {
        const raw = window.localStorage.getItem("metrics");
        setM(raw ? (JSON.parse(raw) as Metrics) : defaultMetrics);
      } catch {
        setM(defaultMetrics);
      }
    };
    load();
    window.addEventListener("metrics-updated", load);
    return () => window.removeEventListener("metrics-updated", load);
  }, []);

  const stats = [
    { label: "Productivity Score", value: `${m.productivityScore}%`, icon: TrendingUp, hint: "This week" },
    { label: "Hours Saved", value: `${m.hoursSaved}h`, icon: Clock, hint: "vs. last week" },
    { label: "Tasks Completed", value: m.tasksCompleted, icon: ListChecks, hint: "All time" },
    { label: "Emails Generated", value: m.emailsGenerated, icon: Mail, hint: "All time" },
    { label: "Meetings Summarized", value: m.meetingsSummarized, icon: FileText, hint: "All time" },
    { label: "Research Requests", value: m.researchProcessed, icon: BookOpen, hint: "All time" },
  ];

  return (
    <div>
      <PageHeader
        icon={Activity}
        title="Welcome back"
        description="Your AI-powered workplace command center. All your productivity intelligence at a glance."
        actions={
          <Button asChild>
            <Link to="/email">
              <Sparkles className="mr-1 h-4 w-4" /> Start creating
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="glass-card">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary-glow/15 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Productivity Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="var(--color-primary)"
                  fill="url(#grad1)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Tasks by Day</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="tasks" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to} className="group">
              <Card className="glass-card transition-all group-hover:-translate-y-0.5 group-hover:shadow-glow">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${a.color} text-white`}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">Open workflow</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>AI Confidence · Recent Outputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Q3 sales email draft", value: 94 },
              { label: "Weekly team sync summary", value: 88 },
              { label: "Market research brief", value: 76 },
              { label: "Follow-up reminder", value: 91 },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{r.label}</span>
                  <span className="text-muted-foreground">{r.value}%</span>
                </div>
                <Progress value={r.value} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Today's Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">Your AI-recommended priorities for today:</p>
            <ul className="space-y-2">
              <li className="rounded-lg border border-border/60 bg-background/40 p-3">
                <p className="font-medium">Finalize Q3 roadmap</p>
                <p className="text-xs text-muted-foreground">High priority · 90 min</p>
              </li>
              <li className="rounded-lg border border-border/60 bg-background/40 p-3">
                <p className="font-medium">Reply to client proposal</p>
                <p className="text-xs text-muted-foreground">High priority · 20 min</p>
              </li>
              <li className="rounded-lg border border-border/60 bg-background/40 p-3">
                <p className="font-medium">Review research doc</p>
                <p className="text-xs text-muted-foreground">Medium · 30 min</p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

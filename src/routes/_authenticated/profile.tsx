import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getMyProfile, updateMyProfile } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{ title: "Profile" }, { name: "description", content: "Your profile." }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const get = useServerFn(getMyProfile);
  const upd = useServerFn(updateMyProfile);
  const { data } = useQuery({ queryKey: ["my-profile"], queryFn: () => get() });

  const [form, setForm] = useState({ name: "", role_title: "", company: "" });
  useEffect(() => {
    if (data) setForm({ name: data.name ?? "", role_title: data.role_title ?? "", company: data.company ?? "" });
  }, [data]);

  const mut = useMutation({
    mutationFn: () => upd({ data: form }),
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["my-profile"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const initials = (form.name || data?.email || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      <PageHeader icon={User} title="Profile" description="How AI addresses you and tailors output." />
      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-2xl font-semibold text-primary-foreground shadow-glow">
              {initials}
            </div>
            <p className="mt-4 font-semibold">{form.name || "Unnamed"}</p>
            <p className="text-sm text-muted-foreground">{form.role_title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{form.company}</p>
            <p className="mt-3 text-xs text-muted-foreground">{data?.email}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Job title</Label>
              <Input className="mt-1.5" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} />
            </div>
            <div>
              <Label>Company</Label>
              <Input className="mt-1.5" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1.5" value={data?.email ?? ""} disabled />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
                {mut.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

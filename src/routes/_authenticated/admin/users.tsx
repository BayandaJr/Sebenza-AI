import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldOff, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMyRoles, listUsers, setUserRole } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Admin — Users" }] }),
  beforeLoad: async () => {
    const r = await getMyRoles();
    if (!r.isAdmin) throw redirect({ to: "/" });
  },
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const setRole = useServerFn(setUserRole);

  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });
  const mut = useMutation({
    mutationFn: (v: { user_id: string; role: "admin" | "user"; grant: boolean }) =>
      setRole({ data: v }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div>
      <PageHeader icon={Users} title="User management" description="Grant or revoke admin access." />
      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr,1fr,auto,auto] gap-3 border-b border-border/60 px-4 py-3 text-xs font-medium text-muted-foreground">
            <div>User</div>
            <div>Email</div>
            <div>Roles</div>
            <div className="text-right">Actions</div>
          </div>
          {isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
          {data?.map((u) => {
            const isAdmin = u.roles.includes("admin");
            return (
              <div key={u.id} className="grid grid-cols-[1fr,1fr,auto,auto] items-center gap-3 border-b border-border/40 px-4 py-3">
                <div>
                  <p className="font-medium">{u.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.role_title || u.company}</p>
                </div>
                <div className="truncate text-sm">{u.email}</div>
                <div className="flex gap-1">
                  {u.roles.map((r) => (
                    <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant={isAdmin ? "outline" : "default"}
                    disabled={mut.isPending}
                    onClick={() =>
                      mut.mutate({ user_id: u.id, role: "admin", grant: !isAdmin })
                    }
                  >
                    {isAdmin ? (
                      <><ShieldOff className="mr-1 h-4 w-4" /> Revoke admin</>
                    ) : (
                      <><Shield className="mr-1 h-4 w-4" /> Make admin</>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
          {data?.length === 0 && <div className="p-6 text-sm text-muted-foreground">No users yet.</div>}
        </CardContent>
      </Card>
    </div>
  );
}

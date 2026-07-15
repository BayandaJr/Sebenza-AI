import { createFileRoute } from "@tanstack/react-router";
import { User } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{ title: "Profile" }, { name: "description", content: "Your profile." }],
  }),
  component: ProfilePage,
});

type Profile = { name: string; role: string; email: string; company: string };

function ProfilePage() {
  const [p, setP] = useLocalStorage<Profile>("profile", {
    name: "Alex Rivera",
    role: "Head of Operations",
    email: "alex@company.com",
    company: "Acme Corp",
  });

  return (
    <div>
      <PageHeader icon={User} title="Profile" description="How AI addresses you and tailors output." />
      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-2xl font-semibold text-primary-foreground shadow-glow">
              {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <p className="mt-4 font-semibold">{p.name}</p>
            <p className="text-sm text-muted-foreground">{p.role}</p>
            <p className="mt-1 text-xs text-muted-foreground">{p.company}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(p) as (keyof Profile)[]).map((k) => (
              <div key={k}>
                <Label className="capitalize">{k}</Label>
                <Input
                  value={p[k]}
                  onChange={(e) => setP({ ...p, [k]: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Button onClick={() => toast.success("Profile saved")}>Save</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

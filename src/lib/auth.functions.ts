import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, name, role_title, company, email")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const ProfileInput = z.object({
  name: z.string().max(120),
  role_title: z.string().max(120),
  company: z.string().max(120),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ProfileInput.parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ name: data.name, role_title: data.role_title, company: data.company })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const roles = (data ?? []).map((r) => r.role);
    return { roles, isAdmin: roles.includes("admin") };
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select("id, name, email, role_title, company, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: roles, error: rerr } = await context.supabase
      .from("user_roles")
      .select("user_id, role");
    if (rerr) throw new Error(rerr.message);
    const rmap = new Map<string, string[]>();
    (roles ?? []).forEach((r: { user_id: string; role: string }) => {
      const arr = rmap.get(r.user_id) ?? [];
      arr.push(r.role);
      rmap.set(r.user_id, arr);
    });
    return (profiles ?? []).map((p) => ({ ...p, roles: rmap.get(p.id) ?? [] }));
  });

const RoleMutation = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "user"]),
  grant: z.boolean(),
});

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RoleMutation.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.grant) {
      const { error } = await context.supabase
        .from("user_roles")
        .insert({ user_id: data.user_id, role: data.role });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      // Prevent removing the last admin
      if (data.role === "admin") {
        const { count } = await context.supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");
        if ((count ?? 0) <= 1) throw new Error("Cannot remove the last admin.");
      }
      const { error } = await context.supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const getResponsibleAI = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("responsible_ai_settings")
      .select("disclaimer, bias_notice, allow_export, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const RAIInput = z.object({
  disclaimer: z.string().min(1).max(2000),
  bias_notice: z.string().min(1).max(2000),
  allow_export: z.boolean(),
});

export const updateResponsibleAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RAIInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("responsible_ai_settings")
      .update({ ...data, updated_by: context.userId, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

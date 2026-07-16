import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Extended profile
export const getExtendedProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    let avatarSignedUrl: string | null = null;
    if (data?.avatar_url) {
      const { data: signed } = await context.supabase.storage
        .from("avatars")
        .createSignedUrl(data.avatar_url, 60 * 60);
      avatarSignedUrl = signed?.signedUrl ?? null;
    }
    return { profile: data, avatarSignedUrl };
  });

const PrefsInput = z.object({
  name: z.string().max(120).optional(),
  role_title: z.string().max(120).optional(),
  company: z.string().max(120).optional(),
  department: z.string().max(120).optional(),
  preferred_tone: z.string().max(60).optional(),
  preferred_email_style: z.string().max(60).optional(),
  working_hours_start: z.string().max(10).optional(),
  working_hours_end: z.string().max(10).optional(),
  accent_color: z.string().max(30).optional(),
  sidebar_layout: z.string().max(30).optional(),
  dashboard_layout: z.string().max(30).optional(),
});

export const updateExtendedProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PrefsInput.parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAvatarPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ path: z.string().max(500) }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ avatar_url: data.path })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: prof } = await context.supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", context.userId)
      .maybeSingle();
    if (prof?.avatar_url) {
      await context.supabase.storage.from("avatars").remove([prof.avatar_url]);
    }
    await context.supabase.from("profiles").update({ avatar_url: "" }).eq("id", context.userId);
    return { ok: true };
  });

// Saved items — one shape for all
const Kind = z.enum(["saved_emails", "saved_meetings", "saved_research", "saved_reports"]);
const SaveInput = z.object({
  kind: Kind,
  title: z.string().max(200).default(""),
  content: z.string().min(1),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const saveItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SaveInput.parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from(data.kind).insert({
      user_id: context.userId,
      title: data.title,
      content: data.content,
      meta: (data.meta ?? {}) as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ kind: Kind }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from(data.kind)
      .select("id, title, content, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const deleteItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ kind: Kind, id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from(data.kind).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Prompt history
export const logPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({ feature: z.string().max(60), prompt: z.string().min(1), response: z.string().default("") })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await context.supabase.from("prompt_history").insert({
      user_id: context.userId,
      feature: data.feature,
      prompt: data.prompt,
      response: data.response,
    });
    return { ok: true };
  });

export const listPromptHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("prompt_history")
      .select("id, feature, prompt, response, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

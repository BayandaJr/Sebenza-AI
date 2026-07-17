import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { User, Upload, Trash2, TrendingUp, Crop } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import {
  getExtendedProfile,
  updateExtendedProfile,
  setAvatarPath,
  removeAvatar,
} from "@/lib/workspace.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{ title: "Profile · Sebenza AI" }, { name: "description", content: "Manage your Sebenza AI profile and AI personalization." }],
  }),
  component: ProfilePage,
});

const TONES = ["professional", "friendly", "formal", "persuasive", "empathetic", "concise"];
const STYLES = ["concise", "detailed", "storytelling", "bulleted", "executive"];
const ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";
const OUTPUT_SIZE = 512;

function ProfilePage() {
  const qc = useQueryClient();
  const get = useServerFn(getExtendedProfile);
  const upd = useServerFn(updateExtendedProfile);
  const setPath = useServerFn(setAvatarPath);
  const rm = useServerFn(removeAvatar);
  const { data } = useQuery({ queryKey: ["ext-profile"], queryFn: () => get() });
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    role_title: "",
    company: "",
    department: "",
    preferred_tone: "professional",
    preferred_email_style: "concise",
    working_hours_start: "09:00",
    working_hours_end: "17:00",
  });

  useEffect(() => {
    if (data?.profile) {
      const p = data.profile;
      setForm({
        name: p.name ?? "",
        role_title: p.role_title ?? "",
        company: p.company ?? "",
        department: p.department ?? "",
        preferred_tone: p.preferred_tone ?? "professional",
        preferred_email_style: p.preferred_email_style ?? "concise",
        working_hours_start: p.working_hours_start ?? "09:00",
        working_hours_end: p.working_hours_end ?? "17:00",
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => upd({ data: form }),
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["ext-profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  // Crop / preview state
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onPick = (file: File) => {
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      toast.error("Only PNG, JPG, JPEG, WEBP allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(String(reader.result));
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const cropAndUpload = async () => {
    if (!rawImage || !imgRef.current) return;
    setUploading(true);
    try {
      const img = new Image();
      img.src = rawImage;
      await new Promise((r, j) => { img.onload = r; img.onerror = j; });
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      // Apply zoom by shrinking source area
      const zoomedSize = size / Math.max(1, zoom);
      const zsx = sx + (size - zoomedSize) / 2;
      const zsy = sy + (size - zoomedSize) / 2;
      ctx.drawImage(img, zsx, zsy, zoomedSize, zoomedSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encode failed"))), "image/webp", 0.9),
      );
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const path = `${uid}/avatar-${Date.now()}.webp`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/webp" });
      if (error) throw new Error(error.message);
      await setPath({ data: { path } });
      toast.success("Profile photo updated");
      qc.invalidateQueries({ queryKey: ["ext-profile"] });
      setRawImage(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };


  const removePhoto = async () => {
    await rm();
    toast.success("Photo removed");
    qc.invalidateQueries({ queryKey: ["ext-profile"] });
  };

  const initials = (form.name || data?.profile?.email || "?")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const productivity = data?.profile?.productivity_score ?? 75;

  return (
    <div>
      <PageHeader icon={User} title="Profile" description="How Sebenza AI addresses you and personalizes responses." />
      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="relative">
              {data?.avatarSignedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.avatarSignedUrl}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover shadow-glow"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-3xl font-semibold text-primary-foreground shadow-glow">
                  {initials}
                </div>
              )}
            </div>
            <p className="mt-4 font-semibold">{form.name || "Unnamed"}</p>
            <p className="text-sm text-muted-foreground">{form.role_title}</p>
            <p className="text-xs text-muted-foreground">{form.department} · {form.company}</p>
            <p className="mt-2 text-xs text-muted-foreground">{data?.profile?.email}</p>

            <div className="mt-5 w-full space-y-2 text-left">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Productivity Score</span>
                <span className="font-semibold text-foreground">{productivity}%</span>
              </div>
              <Progress value={productivity} className="h-1.5" />
            </div>

            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPick(f);
                e.target.value = "";
              }}
            />
            <div className="mt-5 flex w-full gap-2">
              <Button variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" /> {data?.avatarSignedUrl ? "Change" : "Upload"}
              </Button>
              {data?.avatarSignedUrl && (
                <Button variant="ghost" size="icon" onClick={removePhoto} aria-label="Remove photo">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">PNG, JPG, JPEG, WEBP · up to 5MB</p>
          </CardContent>
        </Card>

        <Dialog open={!!rawImage} onOpenChange={(o) => !o && setRawImage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Crop className="h-4 w-4" /> Crop your profile picture</DialogTitle>
              <DialogDescription>Preview and zoom your photo. It will be cropped to a square and saved as WEBP.</DialogDescription>
            </DialogHeader>
            {rawImage && (
              <div className="space-y-4">
                <div className="mx-auto h-56 w-56 overflow-hidden rounded-full border-2 border-primary/40 bg-muted">
                  <img
                    ref={imgRef}
                    src={rawImage}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Zoom</Label>
                  <Slider
                    value={[zoom]}
                    min={1}
                    max={3}
                    step={0.05}
                    onValueChange={(v) => setZoom(v[0])}
                    className="mt-2"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRawImage(null)} disabled={uploading}>Cancel</Button>
              <Button onClick={cropAndUpload} disabled={uploading}>
                {uploading ? "Saving…" : "Save photo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader><CardTitle>Basic details</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Full name</Label>
                <Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Role</Label>
                <Input className="mt-1.5" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} />
              </div>
              <div>
                <Label>Department</Label>
                <Input className="mt-1.5" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <Label>Company</Label>
                <Input className="mt-1.5" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1.5" value={data?.profile?.email ?? ""} disabled />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader><CardTitle>AI Personalization</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Preferred tone</Label>
                <Select value={form.preferred_tone} onValueChange={(v) => setForm({ ...form, preferred_tone: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preferred email style</Label>
                <Select value={form.preferred_email_style} onValueChange={(v) => setForm({ ...form, preferred_email_style: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{STYLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Working hours start</Label>
                <Input type="time" className="mt-1.5" value={form.working_hours_start} onChange={(e) => setForm({ ...form, working_hours_start: e.target.value })} />
              </div>
              <div>
                <Label>Working hours end</Label>
                <Input type="time" className="mt-1.5" value={form.working_hours_end} onChange={(e) => setForm({ ...form, working_hours_end: e.target.value })} />
              </div>
              <p className="sm:col-span-2 text-xs text-muted-foreground">
                Sebenza AI uses these to tailor tone, format, and scheduling suggestions in every workflow.
              </p>
            </CardContent>
          </Card>

          <div>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

interface Props {
  size?: number;
  className?: string;
  fallback?: string;
}

export function UserAvatar({ size = 32, className, fallback }: Props) {
  const { data } = useProfile();
  const src = data?.avatarSignedUrl;
  const seed =
    fallback ??
    data?.profile?.name ??
    data?.profile?.email ??
    "?";
  const initials = seed
    .split(/\s+/)
    .filter(Boolean)
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const style = { width: size, height: size };

  if (src) {
    return (
      <img
        src={src}
        alt={data?.profile?.name ?? "Profile"}
        style={style}
        className={cn("rounded-full object-cover shadow-sm", className)}
      />
    );
  }

  return (
    <span
      style={{ ...style, fontSize: Math.max(10, size * 0.38) }}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow font-semibold text-primary-foreground shadow-sm",
        className,
      )}
      aria-label={data?.profile?.name ?? "Profile"}
    >
      {initials || "?"}
    </span>
  );
}

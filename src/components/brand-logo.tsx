import logoIcon from "@/assets/sebenza-logo-icon.png";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  size = 36,
  alt = "Sebenza AI",
}: {
  className?: string;
  size?: number;
  alt?: string;
}) {
  return (
    <img
      src={logoIcon}
      alt={alt}
      width={size}
      height={size}
      className={cn("object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

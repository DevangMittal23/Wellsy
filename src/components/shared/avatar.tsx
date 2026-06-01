"use client";

import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  className?: string;
}

export function Avatar({
  src,
  name,
  size = "md",
  isOnline = false,
  className,
}: AvatarProps) {
  const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  };

  const statusSizes = {
    xs: "h-1.5 w-1.5 border-[1px]",
    sm: "h-2.5 w-2.5 border-[1.5px]",
    md: "h-3 w-3 border-2",
    lg: "h-4 w-4 border-2",
    xl: "h-5 w-5 border-2",
  };

  const initials = getInitials(name);

  return (
    <div className={cn("relative shrink-0 select-none", className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            "rounded-full object-cover ring-1 ring-border",
            sizeClasses[size].split(" ")[0], // Use matching height class for image
            sizeClasses[size].split(" ")[1]  // Use matching width class for image
          )}
          loading="lazy"
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-accent-muted font-semibold text-accent ring-1 ring-border uppercase",
            sizeClasses[size]
          )}
        >
          {initials || "?"}
        </div>
      )}

      {isOnline && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-background bg-success shadow-lg animate-pulse",
            statusSizes[size]
          )}
          title="Online"
        />
      )}
    </div>
  );
}

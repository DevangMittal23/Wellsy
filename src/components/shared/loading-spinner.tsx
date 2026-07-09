import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "default" | "lg" | "xl";
  className?: string;
}

export function LoadingSpinner({
  size = "default",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    default: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
    xl: "h-16 w-16 border-4",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-t-accent border-r-transparent border-b-transparent border-l-transparent",
        sizeClasses[size],
        className
      )}
      style={{
        borderStyle: "solid",
        borderColor: "var(--color-accent) transparent transparent transparent",
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

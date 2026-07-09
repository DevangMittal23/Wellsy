import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "glow";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          // Variants
          variant === "default" &&
            "bg-accent text-white hover:bg-accent-hover shadow",
          variant === "destructive" &&
            "bg-error text-white hover:bg-error/90 shadow-sm",
          variant === "outline" &&
            "border border-border bg-transparent hover:bg-surface-hover text-text-primary",
          variant === "secondary" &&
            "bg-surface text-text-primary hover:bg-surface-hover border border-border-subtle",
          variant === "ghost" &&
            "hover:bg-surface-hover text-text-secondary hover:text-text-primary",
          variant === "link" &&
            "text-accent underline-offset-4 hover:underline bg-transparent",
          variant === "glow" &&
            "bg-accent text-white hover:bg-accent-hover shadow-glow hover:shadow-glow-strong transition-all duration-300",
          // Sizes
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-9 rounded-md px-3",
          size === "lg" && "h-11 rounded-md px-8",
          size === "icon" && "h-10 w-10",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { SPRING_SNAPPY } from "@/lib/motion/tokens";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "default"
  | "outline"
  | "destructive"
  | "link";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  // RIVA-native variants
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary shadow-subtle",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-line",
  ghost: "bg-transparent text-ink-soft hover:bg-surfaceMuted hover:text-ink",
  danger: "bg-rose-500 text-onSignal hover:bg-rose-700",
  // Shadcn-style variants (same visual language, RIVA colors)
  default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary shadow-subtle",
  outline:
    "border border-line bg-background/60 text-ink-soft hover:bg-surfaceMuted hover:text-ink aria-expanded:bg-surfaceMuted aria-expanded:text-ink",
  destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-md",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-lg",
  icon: "size-9 rounded-md",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.015 }}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        transition={SPRING_SNAPPY}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors duration-150 ease-out",
          "disabled:opacity-40 disabled:pointer-events-none",
          "min-h-[44px] sm:min-h-0", // touch target on small screens
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
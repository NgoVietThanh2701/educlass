import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md bg-white px-3 py-2.5 text-sm text-slate-900",
        "outline-1 -outline-offset-1 outline-slate-300",
        "focus:outline-2 focus:-outline-offset-2 focus:outline-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:bg-neutral-700 dark:text-slate-50 dark:outline-neutral-600",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md bg-white px-3 py-2.5 text-sm text-slate-900",
        "outline-1 -outline-offset-1 outline-slate-300",
        "focus:outline-2 focus:-outline-offset-2 focus:outline-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:bg-neutral-700 dark:text-slate-50 dark:outline-neutral-600",
        "min-h-28 resize-y",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
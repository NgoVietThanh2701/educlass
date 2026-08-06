import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-md bg-white px-3 py-2.5 pr-10 text-sm text-slate-900",
            "outline-1 -outline-offset-1 outline-slate-300",
            "focus:outline-2 focus:-outline-offset-2 focus:outline-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-neutral-700 dark:text-slate-50 dark:outline-neutral-600",
            className,
          )}
          {...props}
        >
          {children}
        </select>

        <ChevronDown className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-slate-500" />
      </div>
    );
  },
);

Select.displayName = "Select";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({
  htmlFor,
  label,
  required,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn(className)}>
      <label
        htmlFor={htmlFor}
        className="mb-2 inline-block text-sm font-medium text-slate-900 dark:text-slate-50"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { SVGProps } from "react";

export function CheckIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={cn("size-3", className)}
      viewBox="0 0 12 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M1 5l3 3 7-7" />
    </svg>
  );
}

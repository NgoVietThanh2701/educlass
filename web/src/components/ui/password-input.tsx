"use client";

import { InputHTMLAttributes, useState } from "react";

import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export function PasswordInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={isVisible ? "text" : "password"}
        className={cn("pr-10", className)}
      />

      <button
        type="button"
        onClick={() => setIsVisible((prev) => !prev)}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        className="absolute top-1/2 right-2 flex -translate-y-1/2 cursor-pointer rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        {isVisible ? (
          <EyeOff className="h-[18px] w-[18px] text-slate-400" />
        ) : (
          <Eye className="h-[18px] w-[18px] text-slate-400" />
        )}
      </button>
    </div>
  );
}

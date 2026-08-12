"use client";

import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavSectionProps {
  title: string;
  showText: boolean;
  collapsedBar: boolean;
  children: React.ReactNode;
}

export function NavSection({
  title,
  showText,
  collapsedBar,
  children,
}: NavSectionProps) {
  return (
    <div>
      <h2
        className={cn(
          "mb-4 text-xs font-medium uppercase leading-5 text-muted-foreground",
          collapsedBar && "lg:justify-center",
        )}
      >
        {showText ? title : <Menu className="mx-auto h-5 w-5" />}
      </h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

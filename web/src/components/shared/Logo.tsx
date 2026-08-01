import Link from "next/link";
import { GraduationCap } from "lucide-react";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export default function Logo({
  className = "",
  iconClassName = "h-8 w-8 text-primary",
  textClassName = "text-lg font-semibold font-heading text-foreground",
}: LogoProps) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 shrink-0 ${className}`.trim()}
    >
      <GraduationCap className={iconClassName} />
      <span className={textClassName}>EduClass</span>
    </Link>
  );
}

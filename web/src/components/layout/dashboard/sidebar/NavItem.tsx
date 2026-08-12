"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { NavItem } from "./Navigation";

interface NavItemProps {
  nav: NavItem;
  index: number;
  showText: boolean;
  collapsedBar: boolean;
  openSubmenu: number | null;
  setOpenSubmenu: React.Dispatch<React.SetStateAction<number | null>>;
  subMenuHeight: Record<number, number>;
  onRegisterSubMenuRef: (index: number, element: HTMLDivElement | null) => void;
  onUserInteracted: () => void;
}

export function NavItemComponent({
  nav,
  index,
  showText,
  collapsedBar,
  openSubmenu,
  setOpenSubmenu,
  subMenuHeight,
  onRegisterSubMenuRef,
  onUserInteracted,
}: NavItemProps) {
  const pathname = usePathname();
  const isOpen = openSubmenu === index;

  const handleToggle = () => {
    onUserInteracted();
    setOpenSubmenu((prev) => (prev === index ? null : index));
  };

  const isActive = (path: string) => pathname === path;

  return (
    <li key={nav.name}>
      {nav.subItems ? (
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "menu-item group cursor-pointer",
            isOpen ? "menu-item-active" : "menu-item-inactive",
            collapsedBar && "lg:justify-center",
          )}
        >
          <span
            className={cn(
              isOpen ? "menu-item-icon-active" : "menu-item-icon-inactive",
              "[&>svg]:h-5 [&>svg]:w-5",
            )}
          >
            {nav.icon}
          </span>
          {showText && <span>{nav.name}</span>}
          {showText && (
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 transition-transform duration-200",
                isOpen ? "rotate-180 text-primary" : "text-muted-foreground",
              )}
            />
          )}
        </button>
      ) : (
        nav.path && (
          <Link
            href={nav.path}
            className={cn(
              "menu-item group",
              isActive(nav.path) ? "menu-item-active" : "menu-item-inactive",
              collapsedBar && "lg:justify-center",
            )}
          >
            <span
              className={cn(
                isActive(nav.path)
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive",
                "[&>svg]:h-5 [&>svg]:w-5",
              )}
            >
              {nav.icon}
            </span>
            {showText && <span>{nav.name}</span>}
          </Link>
        )
      )}

      {nav.subItems && showText && (
        <div
          ref={(el) => {
            onRegisterSubMenuRef(index, el);
          }}
          className="overflow-hidden transition-all duration-300"
          style={{
            height: isOpen ? `${subMenuHeight[index] ?? 0}px` : "0px",
          }}
        >
          <ul className="ml-11 mt-2 space-y-1">
            {nav.subItems.map((subItem) => (
              <li key={subItem.name}>
                <Link
                  href={subItem.path}
                  className={cn(
                    "menu-dropdown-item flex items-center gap-2",
                    isActive(subItem.path)
                      ? "menu-dropdown-item-active"
                      : "menu-dropdown-item-inactive",
                  )}
                >
                  {subItem.icon && (
                    <span className="[&>svg]:h-4 [&>svg]:w-4">
                      {subItem.icon}
                    </span>
                  )}
                  {subItem.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

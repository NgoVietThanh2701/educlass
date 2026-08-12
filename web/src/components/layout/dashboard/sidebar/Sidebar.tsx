"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/dashboard/sidebar/SidebarContext";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { getMainNavItems, getCommonNavItems } from "./Navigation";
import { Brand } from "./Brand";
import { NavItemComponent } from "./NavItem";
import { NavSection } from "./NavSection";
import { MobileDrawerHandle } from "./MobileDrawerHandle";

export default function Sidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const role = user?.role;
  const mainNavItems = getMainNavItems(role);
  const commonNavItems = getCommonNavItems(role);

  // Compute the index that should be auto-opened based on current pathname
  const allNavItems = useMemo(
    () => [...mainNavItems, ...commonNavItems],
    [mainNavItems, commonNavItems],
  );

  const autoOpenIndex = useMemo(() => {
    return allNavItems.findIndex((nav) => {
      if (nav.path && nav.path === pathname) return true;
      return nav.subItems?.some((sub) => sub.path === pathname) ?? false;
    });
  }, [pathname, allNavItems]);

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(
    () => autoOpenIndex,
  );
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>(
    {},
  );

  // Track if user has manually interacted with submenu (to avoid overriding their choice)
  const hasUserInteracted = useRef(false);

  // Sync with auto-open index when pathname changes, but only if user hasn't manually interacted
  useEffect(() => {
    if (!hasUserInteracted.current && autoOpenIndex >= 0) {
      setOpenSubmenu(autoOpenIndex);
    }
    // Reset interaction flag on pathname change
    hasUserInteracted.current = false;
  }, [autoOpenIndex]);

  // Track the real height of the opened submenu so it can animate open/closed.
  useEffect(() => {
    if (openSubmenu === null) return;

    const element = subMenuRefs.current[openSubmenu];
    if (element) {
      setSubMenuHeight((prev) => ({
        ...prev,
        [openSubmenu]: element.scrollHeight,
      }));
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = useCallback(
    (value: React.SetStateAction<number | null>) => {
      hasUserInteracted.current = true;
      setOpenSubmenu(value);
    },
    [],
  );

  // Callback for NavItemComponent to register submenu refs
  const handleRegisterSubMenuRef = useCallback(
    (index: number, element: HTMLDivElement | null) => {
      subMenuRefs.current[index] = element;
    },
    [],
  );

  // Callback for NavItemComponent to mark user interaction
  const handleUserInteracted = useCallback(() => {
    hasUserInteracted.current = true;
  }, []);

  const showText = isExpanded || isHovered || isMobileOpen;
  const collapsedBar = !isExpanded && !isHovered && !isMobileOpen;

  return (
    <aside
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-sidebar px-5",
        "text-sidebar-foreground transition-all duration-300 ease-in-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
        isExpanded || isMobileOpen ? "w-72" : isHovered ? "w-72" : "w-[88px]",
      )}
    >
      {isMobileOpen && <MobileDrawerHandle />}

      {/* Brand / Logo */}
      <div
        className={cn(
          "flex pb-8 pt-8",
          collapsedBar ? "lg:justify-center" : "justify-start",
        )}
      >
        <Brand showText={showText} />
      </div>

      {/* Nav */}
      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto">
        <nav>
          <div className="flex flex-col gap-4">
            {/* Main navigation items (role-based) */}
            <NavSection
              title="Menu"
              showText={showText}
              collapsedBar={collapsedBar}
            >
              {mainNavItems.map((nav, index) => (
                <NavItemComponent
                  key={nav.name}
                  nav={nav}
                  index={index}
                  showText={showText}
                  collapsedBar={collapsedBar}
                  openSubmenu={openSubmenu}
                  setOpenSubmenu={handleSubmenuToggle}
                  subMenuHeight={subMenuHeight}
                  onRegisterSubMenuRef={handleRegisterSubMenuRef}
                  onUserInteracted={handleUserInteracted}
                />
              ))}
            </NavSection>

            {/* Others section (Settings, Help) */}
            <NavSection
              title="Tools"
              showText={showText}
              collapsedBar={collapsedBar}
            >
              {commonNavItems.map((nav, index) => {
                // Adjust index to account for main nav items
                const adjustedIndex = mainNavItems.length + index;
                return (
                  <NavItemComponent
                    key={nav.name}
                    nav={nav}
                    index={adjustedIndex}
                    showText={showText}
                    collapsedBar={collapsedBar}
                    openSubmenu={openSubmenu}
                    setOpenSubmenu={handleSubmenuToggle}
                    subMenuHeight={subMenuHeight}
                    onRegisterSubMenuRef={handleRegisterSubMenuRef}
                    onUserInteracted={handleUserInteracted}
                  />
                );
              })}
            </NavSection>
          </div>
        </nav>
      </div>
    </aside>
  );
}

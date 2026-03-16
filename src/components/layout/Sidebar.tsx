"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Network,
  FileSearch,
  Info,
  Bell,
  Briefcase,
  ShieldCheck,
  Globe,
  Route,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entities", label: "Entities", icon: Users },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/networks", label: "Networks", icon: Network },
  { href: "/evidence", label: "Evidence", icon: FileSearch },
  { href: "/cases", label: "Cases", icon: Briefcase },
  { href: "/travel-rule", label: "Travel Rule", icon: ShieldCheck },
  { href: "/jurisdictions", label: "Jurisdictions", icon: Globe },
  { href: "/pathfinder", label: "Path Finder", icon: Route },
  { href: "/about", label: "About", icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  if (pathname === "/login") return null;

  const isDark = theme === "dark";

  return (
    <aside
      className="flex flex-col w-56 shrink-0 h-screen border-r"
      style={{
        background: "var(--sidebar)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center px-5 py-4 border-b"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <Link href="/dashboard">
          <Image
            src={isDark ? "/logo-white.svg" : "/logo-black.svg"}
            alt="SpatialGO"
            width={120}
            height={22}
            priority
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/" && pathname.startsWith(href)) ||
            (href === "/entities" && pathname.startsWith("/entity/"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600/20 text-blue-500"
                  : isDark
                  ? "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  : "text-gray-500 hover:text-gray-800 hover:bg-black/5"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div
        className="px-3 pb-2 border-t pt-3"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <button
          onClick={toggle}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            isDark
              ? "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              : "text-gray-500 hover:text-gray-800 hover:bg-black/5"
          )}
        >
          {isDark ? (
            <Sun className="w-4 h-4 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 shrink-0" />
          )}
          {isDark ? "Light mode" : "Dark mode"}
        </button>
      </div>

      {/* Footer */}
      <div
        className="px-5 py-3 border-t"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div className="text-[10px] text-gray-500">
          Synthetic data only
          <br />
          Demo v2.0 · 250 entities · 8k txs
        </div>
      </div>
    </aside>
  );
}

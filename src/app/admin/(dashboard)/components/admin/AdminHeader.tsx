"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  UserCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
} from "@/config/site";

type AdminHeaderProps = {
  onMenuClick: () => void;
};

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/students": "Students",
  "/admin/teachers": "Teachers",
  "/admin/classes": "Classes",
  "/admin/subjects": "Subjects",
  "/admin/sessions": "Academic Sessions",
  "/admin/terms": "Academic Terms",
  "/admin/results": "Results",
  "/admin/grading": "Grading & Scoring",
  "/admin/reports": "Report Cards",
  "/admin/attendance": "Attendance",
  "/admin/users": "Users & Roles",
  "/admin/activity": "Activity Logs",
  "/admin/profile": "Profile",
  "/admin/settings": "School Settings",
};

export default function AdminHeader({
  onMenuClick,
}: AdminHeaderProps) {
  const pathname = usePathname();

  const supabase = createClient();

  const [firstName, setFirstName] = useState("Admin");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const pageTitle =
    pageTitles[pathname] ||
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(`${path}/`)
    )?.[1] ||
    "Administration";

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setFirstName(profile.first_name || "Admin");
        setLastName(profile.last_name || "");
      }
    }

    loadProfile();
  }, [supabase]);

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-[80px] border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile menu */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
          >
            <Menu size={21} />
          </button>

          <div className="min-w-0">
            <p
              className="truncate text-lg font-bold sm:text-xl"
              style={{ color: SCHOOL_BLUE_DARK }}
            >
              {pageTitle}
            </p>

            <p className="hidden text-xs text-slate-500 sm:block">
              MSSN Al-Irshad Model School
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search */}
          <button
            type="button"
            aria-label="Search"
            className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 md:flex"
          >
            <Search size={19} />
          </button>

          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <Bell size={19} />

            {/* Notification indicator */}
            <span
              className="absolute right-2.5 top-2 h-2 w-2 rounded-full ring-2 ring-white"
              style={{ backgroundColor: SCHOOL_BLUE }}
            />
          </button>

          {/* Divider */}
          <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

          {/* Profile */}
          <button
            type="button"
            className="group flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition hover:bg-slate-50"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: SCHOOL_BLUE }}
            >
              {initials || "A"}
            </div>

            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-[140px] truncate text-sm font-semibold text-slate-800">
                {firstName} {lastName}
              </p>

              <p className="max-w-[140px] truncate text-[11px] text-slate-500">
                {email || "Administrator"}
              </p>
            </div>

            <ChevronDown
              size={16}
              className="hidden text-slate-400 transition-transform group-hover:translate-y-0.5 sm:block"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
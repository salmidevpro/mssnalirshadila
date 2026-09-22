"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserRoundCheck,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ChartNoAxesCombined,
  FileText,
  ShieldCheck,
  Activity,
  Settings,
  UserCircle,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
} from "@/config/site";

type AdminSidebarProps = {
  open: boolean;
  onClose: () => void;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navigation: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    label: "Academics",
    items: [
      {
        label: "Students",
        href: "/admin/students",
        icon: Users,
      },
      {
        label: "Teachers",
        href: "/admin/teachers",
        icon: UserRoundCheck,
      },
      {
        label: "Classes",
        href: "/admin/classes",
        icon: GraduationCap,
      },
      {
        label: "Subjects",
        href: "/admin/subjects",
        icon: BookOpen,
      },
      {
        label: "Academic Sessions",
        href: "/admin/sessions",
        icon: CalendarDays,
      },
      {
        label: "Terms",
        href: "/admin/terms",
        icon: CalendarDays,
      },
    ],
  },

  {
    label: "Results & Assessment",
    items: [
      {
        label: "Results",
        href: "/admin/results",
        icon: ClipboardCheck,
      },
      {
        label: "Grading & Scoring",
        href: "/admin/grading",
        icon: ChartNoAxesCombined,
      },
      {
        label: "Report Cards",
        href: "/admin/reports",
        icon: FileText,
      },
      {
        label: "Attendance",
        href: "/admin/attendance",
        icon: ClipboardCheck,
      },
    ],
  },

  {
    label: "Management",
    items: [
      {
        label: "Users & Roles",
        href: "/admin/users",
        icon: ShieldCheck,
      },
      {
        label: "Activity Logs",
        href: "/admin/activity",
        icon: Activity,
      },
    ],
  },

  {
    label: "System",
    items: [
      {
        label: "Profile",
        href: "/admin/profile",
        icon: UserCircle,
      },
      {
        label: "School Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export default function AdminSidebar({
  open,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/admin/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col
        border-r border-slate-200 bg-white
        shadow-xl shadow-slate-900/5
        transition-transform duration-300 ease-out
        lg:translate-x-0 lg:shadow-none
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Brand */}
      <div className="flex h-[80px] shrink-0 items-center justify-between border-b border-slate-100 px-5">
        <Link
          href="/admin"
          onClick={onClose}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <img
              src="/images/al-ishad-logo.jpeg"
              alt="MSSN Al-Irshad Model School"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <p
              className="truncate text-sm font-bold leading-tight"
              style={{ color: SCHOOL_BLUE_DARK }}
            >
              MSSN Al-Irshad
            </p>

            <p className="truncate text-[11px] font-medium text-slate-500">
              Administration
            </p>
          </div>
        </Link>

        {/* Mobile close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <X size={19} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <nav className="space-y-6">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {group.label}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`
                        group relative flex items-center gap-3 rounded-xl px-3 py-2.5
                        text-sm font-medium transition-all duration-200
                        ${
                          active
                            ? "bg-blue-50"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      `}
                      style={
                        active
                          ? {
                              color: SCHOOL_BLUE,
                            }
                          : undefined
                      }
                    >
                      {/* Active indicator */}
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full"
                          style={{ backgroundColor: SCHOOL_GOLD }}
                        />
                      )}

                      <span
                        className={`
                          flex h-9 w-9 shrink-0 items-center justify-center
                          rounded-lg transition-colors
                          ${
                            active
                              ? "bg-white shadow-sm"
                              : "bg-transparent group-hover:bg-white"
                          }
                        `}
                      >
                        <Icon size={18} strokeWidth={active ? 2.2 : 1.9} />
                      </span>

                      <span className="flex-1 truncate">
                        {item.label}
                      </span>

                      {active && (
                        <ChevronRight
                          size={15}
                          className="shrink-0 opacity-60"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="shrink-0 border-t border-slate-100 p-4">
        <div className="mb-3 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: SCHOOL_BLUE }}
            >
              A
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">
                Administration
              </p>

              <p className="truncate text-[11px] text-slate-500">
                School Admin Portal
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg">
            <LogOut size={18} />
          </span>

          Sign out
        </button>
      </div>
    </aside>
  );
}
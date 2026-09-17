"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  Save,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
} from "@/config/site";

const SETTINGS_STORAGE_KEY =
  "al-irshad-staff-settings";

type SettingsState = {
  attendanceReminders: boolean;
  assignmentNotifications: boolean;
  resultNotifications: boolean;
  systemNotifications: boolean;
  compactMode: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  attendanceReminders: true,
  assignmentNotifications: true,
  resultNotifications: true,
  systemNotifications: true,
  compactMode: false,
};

type Staff = {
  id: string;
  user_id: string;
  staff_id: string;
  department: string | null;
  position: string | null;
  status: string;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

const mainNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/staff-dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Classes",
    href: "/staff-dashboard/classes",
    icon: Users,
  },
  {
    label: "My Courses",
    href: "/staff-dashboard/courses",
    icon: BookOpen,
  },
  {
    label: "Assignments",
    href: "/staff-dashboard/assignments",
    icon: ClipboardCheck,
  },
  {
    label: "Results",
    href: "/staff-dashboard/results",
    icon: FileText,
  },
  {
    label: "Attendance",
    href: "/staff-dashboard/attendance",
    icon: CheckCircle2,
  },
  {
    label: "Students",
    href: "/staff-dashboard/students",
    icon: GraduationCap,
  },
  {
    label: "Academic Calendar",
    href: "/staff-dashboard/calendar",
    icon: CalendarDays,
  },
];

const secondaryNav: NavItem[] = [
  {
    label: "Profile",
    href: "/staff-dashboard/profile",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/staff-dashboard/settings",
    icon: Settings,
  },
];

/*
 * Toggle component.
 */
const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked
          ? "bg-(--toggle-color)"
          : "bg-slate-200"
      }`}
      style={
        checked
          ? ({
              "--toggle-color": SCHOOL_BLUE,
            } as React.CSSProperties)
          : undefined
      }
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
};

export default function StaffSettingsPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const router = useRouter();
  const pathname = usePathname();

  const [staff, setStaff] =
    useState<Staff | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [settings, setSettings] =
    useState<SettingsState>(
      DEFAULT_SETTINGS
    );

  const [loading, setLoading] =
    useState(true);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Load staff + profile + saved settings.
   */
  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Authenticate user.
         */
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw new Error(
            "Unable to verify your session."
          );
        }

        if (!user) {
          router.replace("/staff-login");
          return;
        }

        /*
         * Load active staff record.
         */
        const {
          data: staffData,
          error: staffError,
        } = await supabase
          .from("staff")
          .select(`
            id,
            user_id,
            staff_id,
            department,
            position,
            status
          `)
          .eq("user_id", user.id)
          .maybeSingle();

        if (staffError) {
          throw new Error(
            staffError.message
          );
        }

        if (
          !staffData ||
          staffData.status !== "active"
        ) {
          await supabase.auth.signOut();
          router.replace("/staff-login");
          return;
        }

        /*
         * Load profile.
         */
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            first_name,
            last_name,
            middle_name,
            email,
            phone,
            avatar_url
          `)
          .eq("id", staffData.user_id)
          .maybeSingle();

        if (profileError) {
          throw new Error(
            profileError.message
          );
        }

        if (!profileData) {
          throw new Error(
            "Your profile could not be found."
          );
        }

        /*
         * Load local settings.
         */
        let savedSettings =
          DEFAULT_SETTINGS;

        try {
          const stored =
            localStorage.getItem(
              SETTINGS_STORAGE_KEY
            );

          if (stored) {
            const parsed =
              JSON.parse(stored);

            savedSettings = {
              ...DEFAULT_SETTINGS,
              ...parsed,
            };
          }
        } catch (storageError) {
          console.warn(
            "Unable to read saved settings:",
            storageError
          );
        }

        if (!mounted) {
          return;
        }

        setStaff(staffData);
        setProfile(profileData);
        setSettings(savedSettings);
      } catch (err) {
        console.error(
          "Settings loading error:",
          err
        );

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load settings."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const staffName =
    [
      profile?.first_name,
      profile?.middle_name,
      profile?.last_name,
    ]
      .filter(Boolean)
      .join(" ") || "Staff Member";

  const initials = (
    `${profile?.first_name?.charAt(0) ?? ""}${
      profile?.last_name?.charAt(0) ?? ""
    }`
  )
    .toUpperCase() || "ST";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/staff-login");
    } catch (err) {
      console.error(
        "Logout error:",
        err
      );
    }
  };

  /*
   * Update one setting locally.
   */
  const updateSetting = (
    key: keyof SettingsState,
    value: boolean
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  };

  /*
   * Save settings to localStorage.
   */
  const handleSave = () => {
    try {
      setSaving(true);
      setSaved(false);
      setError("");

      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(settings)
      );

      /*
       * Small delay gives the UI a proper
       * saving/saved experience.
       */
      window.setTimeout(() => {
        setSaving(false);
        setSaved(true);
      }, 400);
    } catch (err) {
      console.error(
        "Settings save error:",
        err
      );

      setSaving(false);

      setError(
        "Unable to save your settings on this device."
      );
    }
  };

  /*
   * Reset all settings.
   */
  const handleReset = () => {
    const confirmed =
      window.confirm(
        "Reset all staff portal settings to their defaults?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setSettings(DEFAULT_SETTINGS);

      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(DEFAULT_SETTINGS)
      );

      setSaved(true);
      setError("");
    } catch (err) {
      console.error(
        "Settings reset error:",
        err
      );

      setError(
        "Unable to reset your settings."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-transparent"
            style={{
              borderTopColor:
                SCHOOL_BLUE,
            }}
          />

          <p className="text-sm font-medium text-slate-500">
            Loading your settings...
          </p>
        </div>
      </div>
    );
  }

  if (!staff || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <Settings
              size={24}
              className="text-red-600"
            />
          </div>

          <h1 className="text-lg font-bold text-slate-900">
            Unable to load settings
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error ||
              "Your staff account could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{
              backgroundColor:
                SCHOOL_BLUE,
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile backdrop */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() =>
            setMenuOpen(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          menuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-[82px] items-center justify-between border-b border-slate-100 px-5">
          <Link
            href="/staff-dashboard"
            className="flex items-center gap-3"
            onClick={() =>
              setMenuOpen(false)
            }
          >
            <img
              src="/images/al-ishad-logo.jpeg"
              alt="Al-Irshad Model School"
              className="h-11 w-11 rounded-xl object-cover"
            />

            <div>
              <p
                className="text-sm font-extrabold"
                style={{
                  color:
                    SCHOOL_BLUE_DARK,
                }}
              >
                Al-Irshad
              </p>

              <p className="text-[11px] font-medium text-slate-400">
                Staff Portal
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() =>
              setMenuOpen(false)
            }
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                (item.href !==
                  "/staff-dashboard" &&
                  pathname.startsWith(
                    `${item.href}/`
                  ));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor:
                            SCHOOL_BLUE,
                        }
                      : undefined
                  }
                >
                  <Icon
                    size={18}
                    className={
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-600"
                    }
                  />

                  <span>
                    {item.label}
                  </span>

                  {active && (
                    <ChevronRight
                      size={15}
                      className="ml-auto"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="my-6 border-t border-slate-100" />

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Account
          </p>

          <nav className="space-y-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                pathname.startsWith(
                  `${item.href}/`
                );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor:
                            SCHOOL_BLUE,
                        }
                      : undefined
                  }
                >
                  <Icon
                    size={18}
                    className={
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-600"
                    }
                  />

                  <span>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Staff card */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white"
              style={{
                backgroundColor:
                  SCHOOL_BLUE,
              }}
            >
              {profile.avatar_url ? (
                <img
                  src={`${profile.avatar_url}?v=settings`}
                  alt={staffName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">
                {staffName}
              </p>

              <p className="truncate text-[11px] text-slate-400">
                {staff.position ||
                  "Staff Member"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-red-600"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-[270px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setMenuOpen(true)
              }
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Staff Portal
              </p>

              <h1 className="text-lg font-bold text-slate-900">
                Settings
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
            >
              <Bell size={19} />

              <span
                className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor:
                    SCHOOL_GOLD,
                }}
              />
            </button>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="hidden items-center gap-3 sm:flex">
              <div
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white"
                style={{
                  backgroundColor:
                    SCHOOL_BLUE,
                }}
              >
                {profile.avatar_url ? (
                  <img
                    src={`${profile.avatar_url}?v=settings`}
                    alt={staffName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="max-w-[160px]">
                <p className="truncate text-sm font-bold text-slate-800">
                  {staffName}
                </p>

                <p className="truncate text-[11px] text-slate-400">
                  {staff.position ||
                    "Staff Member"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Heading */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Link
                href="/staff-dashboard"
                className="transition hover:text-slate-600"
              >
                Dashboard
              </Link>

              <ChevronRight size={14} />

              <span className="text-slate-600">
                Settings
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Portal Settings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Customize how your staff portal
                behaves on this device.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Notification settings */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SCHOOL_BLUE}12`,
                  }}
                >
                  <Bell
                    size={21}
                    style={{
                      color: SCHOOL_BLUE,
                    }}
                  />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Notifications
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Choose which portal notifications
                    you want to receive.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Attendance */}
              <div className="flex items-center justify-between gap-5 p-6 sm:p-7">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">
                    Attendance Reminders
                  </p>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                    Receive reminders related to
                    attendance activities.
                  </p>
                </div>

                <Toggle
                  checked={
                    settings.attendanceReminders
                  }
                  label="Attendance reminders"
                  onChange={() =>
                    updateSetting(
                      "attendanceReminders",
                      !settings.attendanceReminders
                    )
                  }
                />
              </div>

              {/* Assignments */}
              <div className="flex items-center justify-between gap-5 p-6 sm:p-7">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">
                    Assignment Notifications
                  </p>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                    Receive notifications about
                    assignments and related activities.
                  </p>
                </div>

                <Toggle
                  checked={
                    settings.assignmentNotifications
                  }
                  label="Assignment notifications"
                  onChange={() =>
                    updateSetting(
                      "assignmentNotifications",
                      !settings.assignmentNotifications
                    )
                  }
                />
              </div>

              {/* Results */}
              <div className="flex items-center justify-between gap-5 p-6 sm:p-7">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">
                    Result Notifications
                  </p>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                    Receive notifications when result
                    related actions require your
                    attention.
                  </p>
                </div>

                <Toggle
                  checked={
                    settings.resultNotifications
                  }
                  label="Result notifications"
                  onChange={() =>
                    updateSetting(
                      "resultNotifications",
                      !settings.resultNotifications
                    )
                  }
                />
              </div>

              {/* System */}
              <div className="flex items-center justify-between gap-5 p-6 sm:p-7">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">
                    System Notifications
                  </p>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                    Receive important portal and system
                    announcements.
                  </p>
                </div>

                <Toggle
                  checked={
                    settings.systemNotifications
                  }
                  label="System notifications"
                  onChange={() =>
                    updateSetting(
                      "systemNotifications",
                      !settings.systemNotifications
                    )
                  }
                />
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SCHOOL_GOLD}18`,
                  }}
                >
                  <Settings
                    size={21}
                    style={{
                      color: SCHOOL_GOLD,
                    }}
                  />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Appearance
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Adjust the amount of information
                    displayed across the portal.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">
                    Compact Mode
                  </p>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                    Use a more compact layout with
                    reduced spacing.
                  </p>
                </div>

                <Toggle
                  checked={
                    settings.compactMode
                  }
                  label="Compact mode"
                  onChange={() =>
                    updateSetting(
                      "compactMode",
                      !settings.compactMode
                    )
                  }
                />
              </div>
            </div>
          </section>

          {/* Current settings summary */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-5">
              <h3 className="text-base font-bold text-slate-900">
                Current Preferences
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                A quick overview of your selected
                settings.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Attendance reminders",
                  value:
                    settings.attendanceReminders,
                },
                {
                  label:
                    "Assignment notifications",
                  value:
                    settings.assignmentNotifications,
                },
                {
                  label: "Result notifications",
                  value:
                    settings.resultNotifications,
                },
                {
                  label: "System notifications",
                  value:
                    settings.systemNotifications,
                },
                {
                  label: "Compact mode",
                  value:
                    settings.compactMode,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                >
                  <span className="text-xs font-semibold text-slate-600">
                    {item.label}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      item.value
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {item.value
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Actions */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Save Preferences
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Your settings are saved locally on
                  this device.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor:
                      SCHOOL_BLUE,
                  }}
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle2 size={16} />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Info */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}12`,
                }}
              >
                <Settings
                  size={17}
                  style={{
                    color: SCHOOL_BLUE,
                  }}
                />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  About these settings
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  These preferences control the
                  staff portal experience on this
                  device. Notification switches will
                  become active when the portal&apos;s
                  notification system is connected.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
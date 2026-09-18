"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Info,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  UserRound,
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

const SETTINGS_STORAGE_KEY = "al-irshad-staff-settings";

type SettingsState = {
  attendanceReminders: boolean;
  assignmentNotifications: boolean;
  resultNotifications: boolean;
  systemNotifications: boolean;
  defaultSessionId: string;
  defaultTermId: string;
};

const DEFAULT_SETTINGS: SettingsState = {
  attendanceReminders: true,
  assignmentNotifications: true,
  resultNotifications: true,
  systemNotifications: true,
  defaultSessionId: "",
  defaultTermId: "",
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

type AcademicSession = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
};

type AcademicTerm = {
  id: string;
  name: string;
  session_id: string;
  is_current: boolean;
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
    icon: UserRound,
  },
  {
    label: "Settings",
    href: "/staff-dashboard/settings",
    icon: Settings,
  },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "" : "bg-slate-200"
      }`}
      style={
        checked
          ? {
              backgroundColor: SCHOOL_BLUE,
            }
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
}

function SectionIcon({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      style={{
        backgroundColor: `${color}12`,
      }}
    >
      {children}
    </div>
  );
}

export default function StaffSettingsPage() {
  const supabase = useMemo(() => createClient(), []);

  const router = useRouter();
  const pathname = usePathname();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);

  const [settings, setSettings] =
    useState<SettingsState>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [error, setError] = useState("");

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  /*
   * Load authenticated staff, profile,
   * academic sessions, terms and preferences.
   */
  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");

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
         * Staff
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
          throw new Error(staffError.message);
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
         * Profile
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
          throw new Error(profileError.message);
        }

        if (!profileData) {
          throw new Error(
            "Your profile could not be found."
          );
        }

        /*
         * Academic sessions
         */
        const {
          data: sessionData,
          error: sessionError,
        } = await supabase
          .from("academic_sessions")
          .select(`
            id,
            name,
            start_date,
            end_date,
            is_current
          `)
          .order("start_date", {
            ascending: false,
          });

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        /*
         * Academic terms
         */
        const {
          data: termData,
          error: termError,
        } = await supabase
          .from("academic_terms")
          .select(`
            id,
            name,
            session_id,
            is_current
          `)
          .order("name", {
            ascending: true,
          });

        if (termError) {
          throw new Error(termError.message);
        }

        /*
         * Local preferences.
         */
        let storedSettings = {
          ...DEFAULT_SETTINGS,
        };

        try {
          const stored =
            localStorage.getItem(
              SETTINGS_STORAGE_KEY
            );

          if (stored) {
            const parsed = JSON.parse(stored);

            storedSettings = {
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

        /*
         * If there is no saved session preference,
         * use the current academic session.
         */
        if (
          !storedSettings.defaultSessionId
        ) {
          const currentSession =
            sessionData?.find(
              (session) => session.is_current
            );

          if (currentSession) {
            storedSettings.defaultSessionId =
              currentSession.id;
          }
        }

        /*
         * If there is no saved term preference,
         * use the current term belonging to the
         * selected session.
         */
        if (!storedSettings.defaultTermId) {
          const currentTerm =
            termData?.find(
              (term) =>
                term.is_current &&
                term.session_id ===
                  storedSettings.defaultSessionId
            );

          if (currentTerm) {
            storedSettings.defaultTermId =
              currentTerm.id;
          }
        }

        if (!mounted) {
          return;
        }

        setStaff(staffData);
        setProfile(profileData);
        setSessions(sessionData ?? []);
        setTerms(termData ?? []);
        setSettings(storedSettings);
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

  const initials =
    (
      `${profile?.first_name?.charAt(0) ?? ""}${
        profile?.last_name?.charAt(0) ?? ""
      }`
    ).toUpperCase() || "ST";

  /*
   * Terms belonging to selected session.
   */
  const availableTerms = terms.filter(
    (term) =>
      term.session_id ===
      settings.defaultSessionId
  );

  const selectedSession = sessions.find(
    (session) =>
      session.id === settings.defaultSessionId
  );

  const selectedTerm = terms.find(
    (term) =>
      term.id === settings.defaultTermId
  );

  /*
   * Update setting.
   */
  const updateSetting = <
    K extends keyof SettingsState
  >(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  };

  /*
   * Changing the session automatically
   * selects the current term for that session.
   */
  const handleSessionChange = (
    sessionId: string
  ) => {
    const currentTerm = terms.find(
      (term) =>
        term.session_id === sessionId &&
        term.is_current
    );

    setSettings((current) => ({
      ...current,
      defaultSessionId: sessionId,
      defaultTermId: currentTerm?.id ?? "",
    }));

    setSaved(false);
  };

  /*
   * Save preferences.
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

      window.setTimeout(() => {
        setSaving(false);
        setSaved(true);
      }, 500);
    } catch (err) {
      console.error(
        "Settings save error:",
        err
      );

      setSaving(false);

      setError(
        "Unable to save your preferences on this device."
      );
    }
  };

  /*
   * Reset preferences.
   */
  const handleReset = () => {
    const confirmed = window.confirm(
      "Reset your staff portal preferences to the current academic session and term?"
    );

    if (!confirmed) {
      return;
    }

    const currentSession =
      sessions.find(
        (session) => session.is_current
      );

    const currentTerm =
      terms.find(
        (term) =>
          term.is_current &&
          term.session_id ===
            currentSession?.id
      );

    const resetSettings: SettingsState = {
      ...DEFAULT_SETTINGS,
      defaultSessionId:
        currentSession?.id ?? "",
      defaultTermId:
        currentTerm?.id ?? "",
    };

    try {
      setSettings(resetSettings);

      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(resetSettings)
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

  /*
   * Change password.
   */
  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordMessage("");

    if (!newPassword) {
      setPasswordError(
        "Please enter a new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "The passwords do not match."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(
        "Your password has been changed successfully."
      );
    } catch (err) {
      console.error(
        "Password change error:",
        err
      );

      setPasswordError(
        err instanceof Error
          ? err.message
          : "Unable to change your password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  /*
   * Logout.
   */
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200"
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
            <AlertCircle
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
              aria-label="Notifications"
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
          {/* Page heading */}
          <div className="mb-7">
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
                Settings
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Manage your academic preferences,
                notifications and staff account
                security.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <p className="text-sm leading-6 text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* General */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <SectionIcon color={SCHOOL_BLUE}>
                  <CalendarDays
                    size={21}
                    style={{
                      color: SCHOOL_BLUE,
                    }}
                  />
                </SectionIcon>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    General
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Choose the academic period you
                    normally work with.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-7">
              <div>
                <label
                  htmlFor="session"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Default Academic Session
                </label>

                <select
                  id="session"
                  value={
                    settings.defaultSessionId
                  }
                  onChange={(event) =>
                    handleSessionChange(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-transparent focus:ring-2"
                  style={{
                    ["--tw-ring-color" as string]:
                      SCHOOL_BLUE,
                  }}
                >
                  <option value="">
                    Select academic session
                  </option>

                  {sessions.map((session) => (
                    <option
                      key={session.id}
                      value={session.id}
                    >
                      {session.name}
                      {session.is_current
                        ? " — Current"
                        : ""}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-[11px] leading-5 text-slate-400">
                  Used as your preferred academic
                  session when working in the portal.
                </p>
              </div>

              <div>
                <label
                  htmlFor="term"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Default Academic Term
                </label>

                <select
                  id="term"
                  value={
                    settings.defaultTermId
                  }
                  onChange={(event) =>
                    updateSetting(
                      "defaultTermId",
                      event.target.value
                    )
                  }
                  disabled={
                    !settings.defaultSessionId
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium capitalize text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    Select academic term
                  </option>

                  {availableTerms.map((term) => (
                    <option
                      key={term.id}
                      value={term.id}
                    >
                      {term.name}
                      {term.is_current
                        ? " — Current"
                        : ""}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-[11px] leading-5 text-slate-400">
                  This preference will be used by
                  portal features as they support
                  default academic periods.
                </p>
              </div>
            </div>

            {selectedSession && (
              <div className="mx-6 mb-6 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 sm:mx-7 sm:mb-7">
                <span className="text-xs font-semibold text-slate-500">
                  Selected:
                </span>

                <span className="text-xs font-bold text-slate-800">
                  {selectedSession.name}
                </span>

                {selectedTerm && (
                  <>
                    <span className="text-slate-300">
                      /
                    </span>

                    <span className="text-xs font-bold capitalize text-slate-800">
                      {selectedTerm.name}
                    </span>
                  </>
                )}
              </div>
            )}
          </section>

          {/* Notifications */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <SectionIcon color={SCHOOL_BLUE}>
                  <Bell
                    size={21}
                    style={{
                      color: SCHOOL_BLUE,
                    }}
                  />
                </SectionIcon>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Notifications
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Control your notification
                    preferences for the staff portal.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {[
                {
                  key:
                    "attendanceReminders" as const,
                  title:
                    "Attendance Reminders",
                  description:
                    "Receive reminders related to attendance activities.",
                },
                {
                  key:
                    "assignmentNotifications" as const,
                  title:
                    "Assignment Notifications",
                  description:
                    "Receive updates about assignments and related activities.",
                },
                {
                  key:
                    "resultNotifications" as const,
                  title:
                    "Result Notifications",
                  description:
                    "Receive updates when result-related actions require your attention.",
                },
                {
                  key:
                    "systemNotifications" as const,
                  title:
                    "System Announcements",
                  description:
                    "Receive important portal and school system announcements.",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-5 p-6 sm:p-7"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800">
                      {item.title}
                    </p>

                    <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <Toggle
                    checked={settings[item.key]}
                    label={item.title}
                    onChange={() =>
                      updateSetting(
                        item.key,
                        !settings[item.key]
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Security */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <SectionIcon color={SCHOOL_GOLD}>
                  <ShieldCheck
                    size={21}
                    style={{
                      color: SCHOOL_GOLD,
                    }}
                  />
                </SectionIcon>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Security
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Protect your staff account and
                    manage your sign-in credentials.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <div className="flex flex-col gap-5 rounded-xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
                    <Lock
                      size={17}
                      className="text-slate-500"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Password
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Change the password used to
                      access your staff account.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPasswordOpen(
                      (current) => !current
                    );
                    setPasswordError("");
                    setPasswordMessage("");
                  }}
                  className="shrink-0 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  {passwordOpen
                    ? "Cancel"
                    : "Change Password"}
                </button>
              </div>

              {passwordOpen && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="mb-5">
                    <h4 className="text-sm font-bold text-slate-900">
                      Change Password
                    </h4>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Use a strong password with at
                      least 8 characters.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="new-password"
                        className="mb-2 block text-xs font-bold text-slate-700"
                      >
                        New Password
                      </label>

                      <div className="relative">
                        <input
                          id="new-password"
                          type={
                            showNewPassword
                              ? "text"
                              : "password"
                          }
                          value={newPassword}
                          onChange={(event) =>
                            setNewPassword(
                              event.target.value
                            )
                          }
                          placeholder="Enter new password"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none transition focus:border-transparent focus:ring-2"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowNewPassword(
                              (current) =>
                                !current
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                          aria-label={
                            showNewPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showNewPassword ? (
                            <EyeOff
                              size={17}
                            />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="mb-2 block text-xs font-bold text-slate-700"
                      >
                        Confirm Password
                      </label>

                      <div className="relative">
                        <input
                          id="confirm-password"
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          value={
                            confirmPassword
                          }
                          onChange={(event) =>
                            setConfirmPassword(
                              event.target.value
                            )
                          }
                          placeholder="Confirm new password"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none transition focus:border-transparent focus:ring-2"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (current) =>
                                !current
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff
                              size={17}
                            />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {passwordError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-700">
                      {passwordError}
                    </div>
                  )}

                  {passwordMessage && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium leading-5 text-emerald-700">
                      <CheckCircle2 size={15} />
                      {passwordMessage}
                    </div>
                  )}

                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={
                        handlePasswordChange
                      }
                      disabled={
                        changingPassword
                      }
                      className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        backgroundColor:
                          SCHOOL_BLUE,
                      }}
                    >
                      {changingPassword ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Lock size={16} />
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Account */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <SectionIcon color={SCHOOL_BLUE}>
                  <UserRound
                    size={21}
                    style={{
                      color: SCHOOL_BLUE,
                    }}
                  />
                </SectionIcon>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Account Information
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Information associated with your
                    staff account.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-px overflow-hidden bg-slate-100 sm:grid-cols-2">
              {[
                {
                  label: "Staff ID",
                  value: staff.staff_id,
                },
                {
                  label: "Email",
                  value:
                    profile.email ||
                    "Not provided",
                },
                {
                  label: "Phone",
                  value:
                    profile.phone ||
                    "Not provided",
                },
                {
                  label: "Department",
                  value:
                    staff.department ||
                    "Not assigned",
                },
                {
                  label: "Position",
                  value:
                    staff.position ||
                    "Not assigned",
                },
                {
                  label: "Account Status",
                  value:
                    staff.status,
                  capitalize: true,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white p-5 sm:p-6"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {item.label}
                  </p>

                  <p
                    className={`mt-2 text-sm font-bold ${
                      item.label ===
                      "Account Status"
                        ? "text-emerald-600"
                        : "text-slate-800"
                    } ${
                      item.capitalize
                        ? "capitalize"
                        : ""
                    }`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 p-6 sm:p-7">
              <Link
                href="/staff-dashboard/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <UserRound size={16} />
                Manage Profile
                <ChevronRight size={15} />
              </Link>
            </div>
          </section>

          {/* Privacy */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <SectionIcon color={SCHOOL_GOLD}>
                  <Info
                    size={21}
                    style={{
                      color: SCHOOL_GOLD,
                    }}
                  />
                </SectionIcon>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Privacy & Data
                  </h3>

                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    Your staff profile and academic
                    activity are managed through the
                    school&apos;s portal system. Access
                    to staff and academic information
                    is controlled by your authenticated
                    staff account and the portal&apos;s
                    security policies.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <img
                  src="/images/al-ishad-logo.jpeg"
                  alt="Al-Irshad Model School"
                  className="h-16 w-16 rounded-2xl object-cover"
                />

                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900">
                    Al-Irshad Staff Portal
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Staff management and academic
                    operations portal for Al-Irshad
                    Model School.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Portal
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-700">
                    Staff Area
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Save / Reset */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Save Preferences
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Academic and notification
                  preferences are saved on this
                  device.
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

          {/* Logout */}
          <section className="mt-6 rounded-2xl border border-red-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Sign Out
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Sign out of your Al-Irshad staff
                  portal account on this device.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
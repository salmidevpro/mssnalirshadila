"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
} from "@/config/site";

type Session = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
};

type Term = {
  id: string;
  name: string;
  session_id: string;
  start_date: string | null;
  end_date: string | null;
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
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

const navigation: {
  label: string;
  href: string;
  icon: LucideIcon;
}[] = [
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

export default function StaffAcademicCalendarPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  const [session, setSession] = useState<Session | null>(null);
  const [term, setTerm] = useState<Term | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  /*
  |--------------------------------------------------------------------------
  | LOAD ACADEMIC PERIOD
  |--------------------------------------------------------------------------
  */

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setError("");
    setUnauthenticated(false);

    try {
      // --------------------------------------------------
      // AUTH
      // --------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setUnauthenticated(true);
        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // STAFF
      // --------------------------------------------------

      const { data: staffRecord, error: staffError } = await supabase
        .from("staff")
        .select(
          `
          id,
          user_id,
          staff_id,
          department,
          position,
          status
        `,
        )
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (staffError) {
        throw new Error("Unable to verify your staff account.");
      }

      if (!staffRecord) {
        throw new Error(
          "Your staff account could not be found or is currently inactive.",
        );
      }

      // --------------------------------------------------
      // PROFILE
      // --------------------------------------------------

      const { data: profileRecord, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          first_name,
          last_name,
          middle_name,
          email,
          avatar_url
        `,
        )
        .eq("id", user.id)
        .maybeSingle();

      if (!profileError && profileRecord) {
        setProfile(profileRecord);
      }

      // --------------------------------------------------
      // CURRENT SESSION
      // --------------------------------------------------

      const { data: currentSession, error: sessionError } = await supabase
        .from("academic_sessions")
        .select("id, name, start_date, end_date")
        .eq("is_current", true)
        .maybeSingle();

      if (sessionError) {
        throw new Error("Unable to load the current academic session.");
      }

      if (!currentSession) {
        throw new Error("No current academic session has been configured.");
      }

      setSession(currentSession);

      // --------------------------------------------------
      // CURRENT TERM
      // --------------------------------------------------

      const { data: currentTerm, error: termError } = await supabase
        .from("academic_terms")
        .select("id, name, session_id, start_date, end_date")
        .eq("session_id", currentSession.id)
        .eq("is_current", true)
        .maybeSingle();

      if (termError) {
        throw new Error("Unable to load the current academic term.");
      }

      if (!currentTerm) {
        throw new Error(
          "No current academic term has been configured for this session.",
        );
      }

      setTerm(currentTerm);

      // Start calendar at the current academic term's month
      if (currentTerm.start_date) {
        const startDate = new Date(`${currentTerm.start_date}T00:00:00`);

        if (!Number.isNaN(startDate.getTime())) {
          setCurrentMonth(startDate);
        }
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the academic calendar.",
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCalendar();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadCalendar]);

  // --------------------------------------------------
  // ROUTE CHANGE
  // --------------------------------------------------

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMobileMenuOpen(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
      router.replace("/staff-login");
    } catch (err) {
      console.error(err);
      setLoggingOut(false);
    }
  };

  // --------------------------------------------------
  // STAFF INFO
  // --------------------------------------------------

  const staffName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "Staff Member";

  const staffInitials = profile
    ? `${profile.first_name?.charAt(0) ?? ""}${profile.last_name?.charAt(0) ?? ""}`.toUpperCase()
    : "ST";

  // --------------------------------------------------
  // CALENDAR
  // --------------------------------------------------

  const calendarDays = useMemo(() => {
    return buildCalendarDays(currentMonth);
  }, [currentMonth]);

  const monthLabel = currentMonth.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const goToPreviousMonth = () => {
    setCurrentMonth(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() - 1,
          1,
        ),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() + 1,
          1,
        ),
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc]">
        <StaffSidebar
          pathname={pathname}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />

        <div className="lg:pl-67.5">
          <StaffTopbar
            staffName={staffName}
            initials={staffInitials}
            profile={profile}
            onMenuClick={() => setMobileMenuOpen(true)}
          />

          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl animate-pulse space-y-6">
              <div>
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="mt-3 h-9 w-72 rounded-xl bg-slate-200" />
                <div className="mt-2 h-4 w-96 max-w-full rounded bg-slate-200" />
              </div>

              <div className="h-28 rounded-2xl bg-white shadow-sm" />

              <div className="h-[620px] rounded-3xl bg-white shadow-sm" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // UNAUTHENTICATED
  // --------------------------------------------------

  if (unauthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={26} />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Staff sign-in required
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please sign in to access the academic calendar.
          </p>

          <Link
            href="/staff-login"
            className="mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: SCHOOL_BLUE }}
          >
            Sign in here
          </Link>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f9fc]">
        <StaffSidebar
          pathname={pathname}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />

        <div className="lg:pl-[270px]">
          <StaffTopbar
            staffName={staffName}
            initials={staffInitials}
            profile={profile}
            onMenuClick={() => setMobileMenuOpen(true)}
          />

          <main className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-xl">
              <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertCircle size={26} />
                </div>

                <h1 className="text-xl font-bold text-slate-900">
                  Unable to load academic calendar
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {error}
                </p>

                <button
                  onClick={loadCalendar}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: SCHOOL_BLUE }}
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <StaffSidebar
        pathname={pathname}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      <div className="lg:pl-[270px]">
        <StaffTopbar
          staffName={staffName}
          initials={staffInitials}
          profile={profile}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            {/* ============================================
                HEADER
            ============================================ */}

            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                  <Link
                    href="/staff-dashboard"
                    className="transition hover:text-slate-900"
                  >
                    Dashboard
                  </Link>

                  <ChevronRight size={14} />

                  <span className="font-medium text-slate-900">
                    Academic Calendar
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="hidden h-11 w-11 items-center justify-center rounded-2xl text-white sm:flex"
                    style={{
                      background: `linear-gradient(135deg, ${SCHOOL_BLUE}, ${SCHOOL_BLUE_DARK})`,
                    }}
                  >
                    <CalendarDays size={21} />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                      Academic Calendar
                    </h1>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                      Keep track of important academic dates, terms and school
                      activities.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={goToToday}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <CalendarDays size={17} />
                Today
              </button>
            </div>

            {/* ============================================
                CURRENT ACADEMIC PERIOD
            ============================================ */}

            <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div
                className="h-1 w-full"
                style={{
                  background: `linear-gradient(90deg, ${SCHOOL_BLUE}, ${SCHOOL_GOLD})`,
                }}
              />

              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${SCHOOL_BLUE}12`,
                        color: SCHOOL_BLUE,
                      }}
                    >
                      <GraduationCap size={21} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Current Academic Session
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {session?.name}
                      </p>

                      <p className="mt-0.5 text-sm text-slate-500">
                        {term?.name} Term
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
                    <PeriodDate
                      label="Session starts"
                      date={session?.start_date}
                    />

                    <PeriodDate
                      label="Session ends"
                      date={session?.end_date}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================
                CALENDAR
            ============================================ */}

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {/* Calendar header */}

              <div className="border-b border-slate-100 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Monthly View
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-950">
                      {monthLabel}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={goToPreviousMonth}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                      aria-label="Previous month"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={goToToday}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Today
                    </button>

                    <button
                      type="button"
                      onClick={goToNextMonth}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                      aria-label="Next month"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Weekdays */}

              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <div
                    key={day}
                    className="px-1 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:px-3 sm:text-xs"
                  >
                    <span className="sm:hidden">{day.slice(0, 3)}</span>
                    <span className="hidden sm:inline">{day}</span>
                  </div>
                ))}
              </div>

              {/* Days */}

              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const isToday =
                    day.date.toDateString() === new Date().toDateString();

                  const isCurrentMonth =
                    day.date.getMonth() === currentMonth.getMonth();

                  const isSessionStart =
                    session?.start_date &&
                    sameDate(day.date, session.start_date);

                  const isSessionEnd =
                    session?.end_date &&
                    sameDate(day.date, session.end_date);

                  const isTermStart =
                    term?.start_date &&
                    sameDate(day.date, term.start_date);

                  const isTermEnd =
                    term?.end_date &&
                    sameDate(day.date, term.end_date);

                  return (
                    <div
                      key={day.key}
                      className={`min-h-[86px] border-b border-r border-slate-100 p-1.5 sm:min-h-[120px] sm:p-2 ${
                        isCurrentMonth ? "bg-white" : "bg-slate-50/60"
                      }`}
                    >
                      <div className="flex justify-end">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                            isToday
                              ? "text-white"
                              : isCurrentMonth
                                ? "text-slate-700"
                                : "text-slate-300"
                          }`}
                          style={
                            isToday
                              ? { backgroundColor: SCHOOL_BLUE }
                              : undefined
                          }
                        >
                          {day.date.getDate()}
                        </span>
                      </div>

                      <div className="mt-1 space-y-1">
                        {isSessionStart && (
                          <CalendarEvent
                            label="Session begins"
                            type="session"
                            schoolBlue={SCHOOL_BLUE}
                            schoolGold={SCHOOL_GOLD}
                          />
                        )}

                        {isSessionEnd && (
                          <CalendarEvent
                            label="Session ends"
                            type="session"
                            schoolBlue={SCHOOL_BLUE}
                            schoolGold={SCHOOL_GOLD}
                          />
                        )}

                        {isTermStart && (
                          <CalendarEvent
                            label="Term begins"
                            type="term"
                            schoolBlue={SCHOOL_BLUE}
                            schoolGold={SCHOOL_GOLD}
                          />
                        )}

                        {isTermEnd && (
                          <CalendarEvent
                            label="Term ends"
                            type="term"
                            schoolBlue={SCHOOL_BLUE}
                            schoolGold={SCHOOL_GOLD}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================================
                LEGEND
            ============================================ */}

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <CalendarInfoCard
                icon={<CalendarDays size={19} />}
                title="Academic Session"
                text={session?.name ?? "Current session"}
                accent={SCHOOL_BLUE}
              />

              <CalendarInfoCard
                icon={<Clock3 size={19} />}
                title="Current Term"
                text={term?.name ?? "Current term"}
                accent={SCHOOL_GOLD}
              />

              <CalendarInfoCard
                icon={<CheckCircle2 size={19} />}
                title="Current Status"
                text="Academic period active"
                accent="#059669"
              />
            </div>

            {/* ============================================
                NOTICE
            ============================================ */}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SCHOOL_BLUE}10`,
                    color: SCHOOL_BLUE,
                  }}
                >
                  <FileText size={19} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Academic calendar information
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Session and term dates shown here are taken directly from
                    the school&apos;s current academic session and term
                    configuration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ==================================================
   SIDEBAR
================================================== */

function StaffSidebar({
  pathname,
  mobileMenuOpen,
  setMobileMenuOpen,
  onLogout,
  loggingOut,
}: {
  pathname: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  return (
    <>
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}

        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
          <Link
            href="/staff-dashboard"
            className="flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
              <Image
                src="/images/al-ishad-logo.jpeg"
                alt="Al-Irshad Model School"
                fill
                className="object-contain p-1"
                sizes="44px"
              />
            </div>

            <div>
              <p
                className="text-sm font-bold"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                AL - IRSHAD
              </p>

              <p className="text-[11px] font-medium text-slate-400">
                Staff Portal
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                (item.href !== "/staff-dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  style={
                    active
                      ? {
                          background: `linear-gradient(135deg, ${SCHOOL_BLUE}, ${SCHOOL_BLUE_DARK})`,
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

                  <span className="flex-1">{item.label}</span>

                  {active && <ChevronRight size={15} />}
                </Link>
              );
            })}
          </div>

          <div className="my-5 border-t border-slate-100" />

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Account
          </p>

          <Link
            href="/staff-dashboard/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              pathname.startsWith("/staff-dashboard/profile")
                ? "text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            style={
              pathname.startsWith("/staff-dashboard/profile")
                ? {
                    background: `linear-gradient(135deg, ${SCHOOL_BLUE}, ${SCHOOL_BLUE_DARK})`,
                  }
                : undefined
            }
          >
            <UserRound size={18} />

            <span>Profile</span>
          </Link>
        </nav>

        {/* Logout */}

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={18} />

            <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

/* ==================================================
   TOPBAR
================================================== */

function StaffTopbar({
  staffName,
  initials,
  profile,
  onMenuClick,
}: {
  staffName: string;
  initials: string;
  profile: Profile | null;
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:block">
          <p className="text-xs font-medium text-slate-400">
            Staff Workspace
          </p>

          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            Academic Management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-900">
            {staffName}
          </p>

          <p className="text-xs text-slate-400">Staff Member</p>
        </div>

        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={staffName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: SCHOOL_BLUE }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ==================================================
   PERIOD DATE
================================================== */

function PeriodDate({
  label,
  date,
}: {
  label: string;
  date: string | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {formatDate(date)}
      </p>
    </div>
  );
}

/* ==================================================
   CALENDAR EVENT
================================================== */

function CalendarEvent({
  label,
  type,
  schoolBlue,
  schoolGold,
}: {
  label: string;
  type: "session" | "term";
  schoolBlue: string;
  schoolGold: string;
}) {
  return (
    <div
      className="truncate rounded-md px-1.5 py-1 text-[9px] font-semibold sm:px-2 sm:text-[10px]"
      style={{
        backgroundColor:
          type === "session"
            ? `${schoolBlue}12`
            : `${schoolGold}20`,
        color: type === "session" ? schoolBlue : "#946200",
      }}
      title={label}
    >
      {label}
    </div>
  );
}

/* ==================================================
   INFO CARD
================================================== */

function CalendarInfoCard({
  icon,
  title,
  text,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${accent}12`,
          color: accent,
        }}
      >
        {icon}
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {text}
      </p>
    </div>
  );
}

/* ==================================================
   CALENDAR HELPERS
================================================== */

function buildCalendarDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstDay = new Date(year, monthIndex, 1);

  // Convert JS Sunday=0 into Monday=0
  const startingDay =
    firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  const daysInMonth = new Date(
    year,
    monthIndex + 1,
    0,
  ).getDate();

  const daysInPreviousMonth = new Date(
    year,
    monthIndex,
    0,
  ).getDate();

  const totalCells = 42;

  return Array.from({ length: totalCells }, (_, index) => {
    let date: Date;

    if (index < startingDay) {
      date = new Date(
        year,
        monthIndex - 1,
        daysInPreviousMonth - startingDay + index + 1,
      );
    } else if (index >= startingDay + daysInMonth) {
      date = new Date(
        year,
        monthIndex + 1,
        index - startingDay - daysInMonth + 1,
      );
    } else {
      date = new Date(
        year,
        monthIndex,
        index - startingDay + 1,
      );
    }

    return {
      date,
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    };
  });
}

function sameDate(date: Date, isoDate: string) {
  const target = new Date(`${isoDate}T00:00:00`);

  if (Number.isNaN(target.getTime())) {
    return false;
  }

  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Not set";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "Not set";
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Phone,
  RefreshCw,
  UserRound,
  Users,
  X,
  MapPin,
  UserRoundCheck,
  Calendar,
  Hash,
  type LucideIcon,
} from "lucide-react";

import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
} from "@/config/site";

type Staff = {
  id: string;
  user_id: string;
  staff_id: string | null;
  department: string | null;
  position: string | null;
  status: string | null;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type Student = {
  id: string;
  user_id: string | null;
  student_id: string;
  class_id: string | null;
  admission_number: string | null;
  admission_date: string | null;
  date_of_birth: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  state: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  profile_photo: string | null;
  lga: string | null;
};

type ClassRecord = {
  id: string;
  name: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/staff-dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Classes",
    href: "/staff-dashboard/classes",
    icon: GraduationCap,
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
    icon: CheckCircle2,
  },
  {
    label: "Attendance",
    href: "/staff-dashboard/attendance",
    icon: CalendarDays,
  },
  {
    label: "Students",
    href: "/staff-dashboard/students",
    icon: Users,
  },
  {
    label: "Academic Calendar",
    href: "/staff-dashboard/calendar",
    icon: CalendarDays,
  },
  {
    label: "Profile",
    href: "/staff-dashboard/profile",
    icon: UserRound,
  },
];

export default function StaffStudentDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const studentId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [studentClass, setStudentClass] = useState<ClassRecord | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [error, setError] = useState("");
  const [unauthenticated, setUnauthenticated] = useState(false);

  const loadStudent = useCallback(
    async (isRefresh = false) => {
      if (!studentId) {
        setError("Invalid student ID.");
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setUnauthenticated(false);

      try {
        /*
         * AUTH
         */
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setUnauthenticated(true);
          return;
        }

        /*
         * VERIFY STAFF
         */
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
          console.error("Staff verification error:", staffError);

          throw new Error("Unable to verify your staff account.");
        }

        if (!staffRecord) {
          throw new Error(
            "Your staff account could not be found or is currently inactive.",
          );
        }

        setStaff(staffRecord);

        /*
         * STAFF PROFILE
         */
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

        if (profileError) {
          console.warn("Profile loading error:", profileError);
        } else {
          setProfile(profileRecord);
        }

        /*
         * LOAD STUDENT
         *
         * Uses only verified students table columns.
         */
        const { data: studentRecord, error: studentError } = await supabase
          .from("students")
          .select(
            `
              id,
              user_id,
              student_id,
              class_id,
              admission_number,
              admission_date,
              date_of_birth,
              status,
              created_at,
              updated_at,
              full_name,
              phone,
              address,
              state,
              guardian_name,
              guardian_phone,
              profile_photo,
              lga
            `,
          )
          .eq("id", studentId)
          .maybeSingle();

        if (studentError) {
          console.error("Student query error:", studentError);

          throw new Error(
            studentError.message || "Unable to load student information.",
          );
        }

        if (!studentRecord) {
          throw new Error("Student record could not be found.");
        }

        setStudent(studentRecord);

        /*
         * LOAD CLASS
         *
         * The relationship has already been verified:
         *
         * students.class_id -> classes.id
         */
        if (studentRecord.class_id) {
          const { data: classRecord, error: classError } = await supabase
            .from("classes")
            .select(
              `
                id,
                name
              `,
            )
            .eq("id", studentRecord.class_id)
            .maybeSingle();

          if (classError) {
            console.error("Class query error:", classError);

            throw new Error(
              classError.message || "Unable to load student's class.",
            );
          }

          setStudentClass(classRecord);
        } else {
          setStudentClass(null);
        }
      } catch (err) {
        console.error("Error loading student:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the student.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase, studentId],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStudent();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadStudent]);

  const staffName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Staff Member";

  const initials =
    [profile?.first_name?.[0], profile?.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "ST";

  const studentInitials =
    student?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "ST";

  const isActive =
    !student?.status ||
    ["active", "enrolled"].includes(student.status.toLowerCase());

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/staff-login");
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (unauthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: SCHOOL_BLUE }}
          >
            <UserRound size={26} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Authentication Required
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please sign in to access the staff portal.
          </p>

          <Link
            href="/staff-login"
            className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: SCHOOL_BLUE }}
          >
            Go to Staff Login
          </Link>
        </div>
      </main>
    );
  }

  if (error || !student) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={28} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Unable to Load Student
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || "Student information could not be loaded."}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => void loadStudent()}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: SCHOOL_BLUE }}
            >
              <RefreshCw size={16} />
              Try Again
            </button>

            <Link
              href="/staff-dashboard/students"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Back to Students
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      {mobileMenuOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-67.5 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-19 items-center justify-between border-b border-slate-100 px-5">
          <Link
            href="/staff-dashboard"
            className="flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image
              src="/images/al-ishad-logo.jpeg"
              alt="Al-Irshad Model School"
              width={44}
              height={44}
              className="h-11 w-11 rounded-xl object-cover"
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                Al-Irshad Model School
              </p>

              <p className="text-xs text-slate-500">Staff Portal</p>
            </div>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navItems.map((item) => {
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
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                  active
                    ? "text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                style={active ? { backgroundColor: SCHOOL_BLUE } : undefined}
              >
                <Icon
                  size={18}
                  className={active ? "text-white" : "text-slate-400"}
                />

                <span className="flex-1">{item.label}</span>

                {active && <ChevronRight size={16} />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="lg:pl-67.5">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex h-19 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="hidden text-xs font-medium text-slate-400 sm:block">
                Staff Portal
              </p>

              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Student Profile
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {staffName}
              </p>

              <p className="text-xs text-slate-500">
                {staff?.position || "Staff"}
              </p>
            </div>

            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={staffName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: SCHOOL_BLUE }}
              >
                {initials}
              </div>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* BREADCRUMB */}
          <div className="mb-5 flex items-center gap-2 text-sm">
            <Link
              href="/staff-dashboard/students"
              className="font-medium text-slate-500 transition hover:text-slate-900"
            >
              Students
            </Link>

            <ChevronRight size={15} className="text-slate-300" />

            <span className="font-medium text-slate-400">
              Student Profile
            </span>
          </div>

          {/* PROFILE HEADER */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div
              className="h-2"
              style={{ backgroundColor: SCHOOL_BLUE }}
            />

            <div className="p-5 sm:p-7 lg:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                  {student.profile_photo ? (
                    <Image
                      src={student.profile_photo}
                      alt={student.full_name}
                      width={96}
                      height={96}
                      className="h-20 w-20 shrink-0 rounded-2xl border border-slate-200 object-cover sm:h-24 sm:w-24"
                      unoptimized
                    />
                  ) : (
                    <div
                      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white sm:h-24 sm:w-24"
                      style={{ backgroundColor: SCHOOL_BLUE }}
                    >
                      {studentInitials}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        {student.full_name}
                      </h1>

                      <StatusBadge
                        active={isActive}
                        status={student.status}
                      />
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Student ID:{" "}
                      <span className="font-mono font-semibold text-slate-700">
                        {student.student_id}
                      </span>
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Class:{" "}
                      <span className="font-semibold text-slate-700">
                        {studentClass?.name || "Not assigned"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="/staff-dashboard/students"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ArrowLeft size={16} />
                    Back to Students
                  </Link>

                  <button
                    onClick={() => void loadStudent(true)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: SCHOOL_BLUE }}
                  >
                    {refreshing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* QUICK INFORMATION */}
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickCard
              icon={GraduationCap}
              label="Class"
              value={studentClass?.name || "Not assigned"}
            />

            <QuickCard
              icon={Hash}
              label="Admission No."
              value={student.admission_number || "—"}
            />

            <QuickCard
              icon={Phone}
              label="Phone"
              value={student.phone || "—"}
            />

            <QuickCard
              icon={Calendar}
              label="Admission Date"
              value={formatDate(student.admission_date)}
            />
          </section>

          {/* INFORMATION GRID */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* PERSONAL INFORMATION */}
            <InfoSection
              title="Personal Information"
              description="Basic student details"
            >
              <DetailRow
                icon={UserRound}
                label="Full Name"
                value={student.full_name}
              />

              <DetailRow
                icon={Hash}
                label="Student ID"
                value={student.student_id}
                mono
              />

              <DetailRow
                icon={Hash}
                label="Admission Number"
                value={student.admission_number}
                mono
              />

              <DetailRow
                icon={CalendarDays}
                label="Date of Birth"
                value={formatDate(student.date_of_birth)}
              />

              <DetailRow
                icon={Calendar}
                label="Admission Date"
                value={formatDate(student.admission_date)}
              />

              <DetailRow
                icon={GraduationCap}
                label="Class"
                value={studentClass?.name || "Not assigned"}
              />

              <DetailRow
                icon={CheckCircle2}
                label="Status"
                value={student.status || "—"}
              />
            </InfoSection>

            {/* CONTACT INFORMATION */}
            <InfoSection
              title="Contact Information"
              description="Student contact and location details"
            >
              <DetailRow
                icon={Phone}
                label="Phone"
                value={student.phone}
              />

              <DetailRow
                icon={MapPin}
                label="Address"
                value={student.address}
              />

              <DetailRow
                icon={MapPin}
                label="State"
                value={student.state}
              />

              <DetailRow
                icon={MapPin}
                label="LGA"
                value={student.lga}
              />
            </InfoSection>

            {/* GUARDIAN INFORMATION */}
            <InfoSection
              title="Guardian Information"
              description="Parent or guardian contact details"
            >
              <DetailRow
                icon={UserRoundCheck}
                label="Guardian Name"
                value={student.guardian_name}
              />

              <DetailRow
                icon={Phone}
                label="Guardian Phone"
                value={student.guardian_phone}
              />
            </InfoSection>

            {/* SYSTEM INFORMATION */}
            <InfoSection
              title="Record Information"
              description="System record details"
            >
              <DetailRow
                icon={Hash}
                label="Record ID"
                value={student.id}
                mono
              />

              <DetailRow
                icon={CalendarDays}
                label="Created"
                value={formatDateTime(student.created_at)}
              />

              <DetailRow
                icon={RefreshCw}
                label="Last Updated"
                value={formatDateTime(student.updated_at)}
              />
            </InfoSection>
          </div>

          {/* FOOTER NOTICE */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
              style={{ color: SCHOOL_BLUE }}
            />

            <p className="text-xs leading-5 text-slate-600">
              Student information displayed here is controlled by the school
              administration and your staff permissions.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({
  active,
  status,
}: {
  active: boolean;
  status: string | null;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />

      {active
        ? status?.toLowerCase() === "enrolled"
          ? "Enrolled"
          : "Active"
        : status || "Inactive"}
    </span>
  );
}

/* =========================================================
   QUICK CARD
   ========================================================= */

function QuickCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${SCHOOL_BLUE}12`,
            color: SCHOOL_BLUE,
          }}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-1 truncate text-sm font-bold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INFORMATION SECTION
   ========================================================= */

function InfoSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>

        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  );
}

/* =========================================================
   DETAIL ROW
   ========================================================= */

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 p-5">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p
          className={`mt-1 break-words text-sm font-semibold text-slate-700 ${
            mono ? "font-mono text-xs" : ""
          }`}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   DATE HELPERS
   ========================================================= */

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/* =========================================================
   LOADING
   ========================================================= */

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[270px] border-r border-slate-200 bg-white lg:block">
          <div className="h-[76px] border-b border-slate-100 p-5">
            <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-100" />
          </div>

          <div className="space-y-3 p-4">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="h-11 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        </aside>

        <div className="flex-1">
          <div className="h-[76px] border-b border-slate-200 bg-white" />

          <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
            <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />

            <div className="h-40 animate-pulse rounded-3xl bg-white shadow-sm" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl bg-white shadow-sm"
                />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-3xl bg-white shadow-sm"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
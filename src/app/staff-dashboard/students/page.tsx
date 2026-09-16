"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AlertCircle,
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
  RefreshCw,
  Search,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { SCHOOL_BLUE, SCHOOL_BLUE_DARK, SCHOOL_GOLD } from "@/config/site";

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
  classes: {
    id: string;
    name: string;
  } | null;
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

export default function StaffStudentsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [error, setError] = useState("");
  const [unauthenticated, setUnauthenticated] = useState(false);

  const loadStudents = useCallback(
    async (isRefresh = false) => {
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
         * STUDENTS
         *
         * This now matches the REAL students table schema.
         */
      try {
  // 1. Load students
            /*
          * STUDENTS
          */

        const { data: studentRecords, error: studentsError } = await supabase
          .from("students")
          .select(`
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
          `)
          .order("full_name", { ascending: true });

        if (studentsError) {
          console.error("Students query error:", studentsError);

          throw new Error(
            studentsError.message || "Unable to load students.",
          );
        }

        console.log("Students query result:", studentRecords);

        console.log(
          "STUDENT CLASS DEBUG:",
          (studentRecords ?? []).map((student) => ({
            student: student.full_name,
            class_id: student.class_id,
          })),
        );

        /*
        * LOAD CLASSES
        */

        const classIds = Array.from(
          new Set(
            (studentRecords ?? [])
              .map((student) => student.class_id)
              .filter((id): id is string => Boolean(id)),
          ),
        );

        let classesMap = new Map<
          string,
          {
            id: string;
            name: string;
          }
        >();

        if (classIds.length > 0) {
          const { data: classRecords, error: classesError } = await supabase
            .from("classes")
            .select(`
              id,
              name
            `)
            .in("id", classIds);

          if (classesError) {
            console.error("Classes query error:", classesError);

            throw new Error(
              classesError.message || "Unable to load classes.",
            );
          }

          classesMap = new Map(
            (classRecords ?? []).map((classItem) => [
              classItem.id,
              {
                id: classItem.id,
                name: classItem.name,
              },
            ]),
          );
        }

        /*
        * COMBINE STUDENTS + CLASS
        */

        const formattedStudents: Student[] = (studentRecords ?? []).map(
          (student) => ({
            ...student,
            classes: student.class_id
              ? classesMap.get(student.class_id) ?? null
              : null,
          }),
        );

            // 5. Save students
            setStudents(formattedStudents);
          } catch (err) {
            console.error("Error loading students:", err);

            setError(
              err instanceof Error
                ? err.message
                : "Something went wrong while loading students.",
            );
          } finally {
            setLoading(false);
            setRefreshing(false);
          }
      } catch (err) {
        console.error("Error loading staff data:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the dashboard.",
        );
      }
    },
    [supabase],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStudents();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadStudents]);

  /*
   * FILTER
   */
  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        (student.full_name ?? "").toLowerCase().includes(query) ||
        (student.student_id ?? "").toLowerCase().includes(query) ||
        (student.admission_number ?? "").toLowerCase().includes(query) ||
        (student.phone ?? "").toLowerCase().includes(query);

      const isActive =
        !student.status ||
        ["active", "enrolled"].includes(student.status.toLowerCase());

      return matchesSearch && (showInactive || isActive);
    });
  }, [students, search, showInactive]);

  /*
   * STATS
   */
  const stats = useMemo(() => {
    const active = students.filter((student) => {
      if (!student.status) return true;

      return ["active", "enrolled"].includes(student.status.toLowerCase());
    }).length;

    const inactive = students.length - active;

    const classes = new Set(
      students
        .map((student) => student.class_id)
        .filter((classId): classId is string => Boolean(classId)),
    ).size;

    return {
      total: students.length,
      active,
      inactive,
      classes,
    };
  }, [students]);

  const staffName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Staff Member";

  const initials =
    [profile?.first_name?.[0], profile?.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "ST";

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

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={28} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Unable to Load Students
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>

          <button
            onClick={() => void loadStudents()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: SCHOOL_BLUE }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
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
                Students
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
          {/* HEADER */}
          <section className="mb-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                  <span style={{ color: SCHOOL_GOLD }}>Staff Portal</span>

                  <span className="text-slate-300">/</span>

                  <span className="text-slate-400">Students</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Students
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  View and manage student information available to your staff
                  account.
                </p>
              </div>

              <button
                onClick={() => void loadStudents(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                Refresh
              </button>
            </div>
          </section>

          {/* STATS */}
          <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Students"
              value={stats.total}
              icon={Users}
              description="Students in the system"
            />

            <StatCard
              label="Active Students"
              value={stats.active}
              icon={CheckCircle2}
              description="Currently active"
            />

            <StatCard
              label="Inactive Students"
              value={stats.inactive}
              icon={AlertCircle}
              description="Not currently active"
            />

            <StatCard
              label="Classes"
              value={stats.classes}
              icon={GraduationCap}
              description="Classes represented"
            />
          </section>

          {/* STUDENT DIRECTORY */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Student Directory
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {filteredStudents.length} student
                    {filteredStudents.length === 1 ? "" : "s"} displayed
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 sm:w-85">
                    <Search
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search name, ID, admission no..."
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3.5 text-sm font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={(event) =>
                        setShowInactive(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Show inactive
                  </label>
                </div>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Users size={26} />
                </div>

                <h3 className="mt-5 text-base font-bold text-slate-900">
                  No students found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {search
                    ? "Try changing your search term or clearing the search."
                    : "There are currently no students matching the selected filters."}
                </p>

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="mt-5 text-sm font-semibold"
                    style={{ color: SCHOOL_BLUE }}
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* DESKTOP */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-205">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                          Student
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                          Student ID
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                          Admission No.
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                          Class
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                          Status
                        </th>

                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((student) => (
                        <StudentTableRow key={student.id} student={student} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {filteredStudents.map((student) => (
                    <StudentMobileCard key={student.id} student={student} />
                  ))}
                </div>
              </>
            )}
          </section>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
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
   DESKTOP ROW
   ========================================================= */

function StudentTableRow({ student }: { student: Student }) {
  const name = student.full_name || "Student";

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "ST";

  const active =
    !student.status ||
    ["active", "enrolled"].includes(student.status.toLowerCase());

  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {student.profile_photo ? (
            <Image
              src={student.profile_photo}
              alt={name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: SCHOOL_BLUE }}
            >
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {name}
            </p>

            <p className="text-xs text-slate-500">
              {student.phone || "No phone number"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <span className="font-mono text-sm font-medium text-slate-700">
          {student.student_id || "—"}
        </span>
      </td>

      <td className="px-6 py-4">
        <span className="font-mono text-sm text-slate-600">
          {student.admission_number || "—"}
        </span>
      </td>

      <td className="px-6 py-4">
        <span className="text-sm font-medium text-slate-700">
          {student.classes?.name || "Not assigned"}
        </span>
      </td>

      <td className="px-6 py-4">
        <StatusBadge active={active} status={student.status} />
      </td>

      <td className="px-6 py-4 text-right">
        <Link
          href={`/staff-dashboard/students/${student.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition hover:bg-blue-50"
          style={{ color: SCHOOL_BLUE }}
        >
          View
          <ChevronRight size={14} />
        </Link>
      </td>
    </tr>
  );
}

/* =========================================================
   MOBILE CARD
   ========================================================= */

function StudentMobileCard({ student }: { student: Student }) {
  const name = student.full_name || "Student";

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "ST";

  const active =
    !student.status ||
    ["active", "enrolled"].includes(student.status.toLowerCase());

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        {student.profile_photo ? (
          <Image
            src={student.profile_photo}
            alt={name}
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover"
            unoptimized
          />
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: SCHOOL_BLUE }}
          >
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {name}
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                {student.student_id || "No student ID"}
              </p>
            </div>

            <StatusBadge active={active} status={student.status} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <InfoBox label="Admission No." value={student.admission_number} />

            <InfoBox label="Class" value={student.classes?.name || null} />

            <InfoBox label="Phone" value={student.phone} />

            <InfoBox label="Guardian" value={student.guardian_name} />
          </div>

          <Link
            href={`/staff-dashboard/students/${student.id}`}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View Student
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INFO BOX
   ========================================================= */

function InfoBox({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

/* =========================================================
   STATUS
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
   STAT CARD
   ========================================================= */

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${SCHOOL_BLUE}12`,
            color: SCHOOL_BLUE,
          }}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
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
            <div className="space-y-3">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="h-9 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
                />
              ))}
            </div>

            <div className="h-[500px] animate-pulse rounded-3xl bg-white shadow-sm" />
          </div>
        </div>
      </div>
    </main>
  );
}

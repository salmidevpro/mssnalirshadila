"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Search,
  UserRound,
  Users,
  X,
  Check,
  ChevronDown,
  Settings,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  SCHOOL_BLUE,
  SCHOOL_GOLD,
} from "@/config/site";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/* =========================================================
   TYPES
   ========================================================= */

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
  is_current: boolean;
};

type AcademicTerm = {
  id: string;
  name: string;
  session_id: string;
  is_current: boolean;
};

type ClassItem = {
  id: string;
  name: string;
  description: string | null;
};

type Student = {
  id: string;
  user_id: string | null;
  student_id: string;
  class_id: string;
  admission_number: string | null;
  full_name: string | null;
  profile_photo: string | null;
  status: string | null;
};

type AttendanceRecord = {
  id?: string;
  student_id: string;
  session_id: string;
  term_id: string;
  attendance_date: string;
  present: boolean;
  note: string | null;
};

type AttendanceState = {
  present: boolean;
  note: string;
};

/* =========================================================
   NAVIGATION
   ========================================================= */

const navigation = [
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
    icon: FileText,
  },
  {
    label: "Results",
    href: "/staff-dashboard/results",
    icon: GraduationCap,
  },
  {
    label: "Attendance",
    href: "/staff-dashboard/attendance",
    icon: ClipboardCheck,
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
];

const secondaryNavigation = [
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

/* =========================================================
   HELPERS
   ========================================================= */

function getLocalDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  if (!date) return "";

  const value = new Date(`${date}T00:00:00`);

  return value.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTerm(term: string) {
  if (!term) return "";

  return term.charAt(0).toUpperCase() + term.slice(1);
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function AttendancePage() {
  const router = useRouter();
  const pathname = usePathname();

  /* -------------------------------------------------------
     AUTH / STAFF
  ------------------------------------------------------- */

  const [staff, setStaff] = useState<Staff | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  /* -------------------------------------------------------
     ACADEMIC DATA
  ------------------------------------------------------- */

  const [session, setSession] = useState<AcademicSession | null>(null);
  const [term, setTerm] = useState<AcademicTerm | null>(null);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");

  const [students, setStudents] = useState<Student[]>([]);

  /* -------------------------------------------------------
     ATTENDANCE
  ------------------------------------------------------- */

  const [selectedDate, setSelectedDate] = useState(getLocalDate());

  const [attendance, setAttendance] = useState<
    Record<string, AttendanceState>
  >({});

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */

  const [loadingData, setLoadingData] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /* =========================================================
     LOAD STAFF + PROFILE
  ========================================================= */

  const loadStaff = useCallback(async () => {
    try {
      setAuthLoading(true);
      setAuthError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        router.replace("/staff-login");
        return;
      }

      const { data: staffData, error: staffError } = await supabase
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
        throw staffError;
      }

      if (!staffData) {
        setAuthError(
          "Your account is not linked to an active staff profile."
        );
        return;
      }

      if (staffData.status !== "active") {
        setAuthError(
          "Your staff account is currently inactive. Please contact the school administrator."
        );
        return;
      }

      setStaff(staffData);

      const { data: profileData, error: profileError } = await supabase
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
        throw profileError;
      }

      setProfile(profileData);
    } catch (err) {
      console.error("STAFF AUTH ERROR:", err);

      setAuthError(
        err instanceof Error
          ? err.message
          : "Unable to load your staff account."
      );
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  /* =========================================================
     LOAD SESSION / TERM / ASSIGNED CLASSES
  ========================================================= */

  const loadAcademicData = useCallback(async () => {
    if (!staff) return;

    try {
      setLoadingData(true);
      setError("");

      /* Current session */
      const { data: sessionData, error: sessionError } = await supabase
        .from("academic_sessions")
        .select("id, name, is_current")
        .eq("is_current", true)
        .maybeSingle();

      if (sessionError) {
        throw sessionError;
      }

      if (!sessionData) {
        throw new Error("No current academic session was found.");
      }

      setSession(sessionData);

      /* Current term */
      const { data: termData, error: termError } = await supabase
        .from("academic_terms")
        .select("id, name, session_id, is_current")
        .eq("session_id", sessionData.id)
        .eq("is_current", true)
        .maybeSingle();

      if (termError) {
        throw termError;
      }

      if (!termData) {
        throw new Error("No current academic term was found.");
      }

      setTerm(termData);

      /* Teacher course assignments */
      const { data: courseTeacherData, error: assignmentError } =
        await supabase
          .from("course_teachers")
          .select(`
            course_id
          `)
          .eq("teacher_id", staff.id)
          .eq("session_id", sessionData.id)
          .eq("term_id", termData.id);

      if (assignmentError) {
        throw assignmentError;
      }

      const courseIds = Array.from(
        new Set(
          (courseTeacherData ?? [])
            .map((item) => item.course_id)
            .filter(Boolean)
        )
      );

      if (courseIds.length === 0) {
        setClasses([]);
        setSelectedClassId("");
        return;
      }

      /* Courses */
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          id,
          class_id
        `)
        .in("id", courseIds);

      if (coursesError) {
        throw coursesError;
      }

      const classIds = Array.from(
        new Set(
          (coursesData ?? [])
            .map((course) => course.class_id)
            .filter(Boolean)
        )
      );

      if (classIds.length === 0) {
        setClasses([]);
        setSelectedClassId("");
        return;
      }

      /* Classes */
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          description
        `)
        .in("id", classIds);

      if (classesError) {
        throw classesError;
      }

      const sortedClasses = ((classesData ?? []) as ClassItem[]).sort(
        (a, b) => a.name.localeCompare(b.name)
      );

      setClasses(sortedClasses);

      setSelectedClassId((current) => {
        if (current && sortedClasses.some((item) => item.id === current)) {
          return current;
        }

        return sortedClasses[0]?.id ?? "";
      });
    } catch (err) {
      console.error("ACADEMIC DATA ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load attendance data."
      );
    } finally {
      setLoadingData(false);
    }
  }, [staff]);

  /* =========================================================
     LOAD STUDENTS
  ========================================================= */

  const loadStudents = useCallback(async () => {
    if (!selectedClassId || !session) {
      setStudents([]);
      setAttendance({});
      return;
    }

    try {
      setLoadingStudents(true);
      setError("");
      setSuccess("");

      /* Active students enrolled in this class/session */
      const { data: enrollmentData, error: enrollmentError } =
        await supabase
          .from("student_enrollments")
          .select(`
            student_id,
            class_id,
            status
          `)
          .eq("session_id", session.id)
          .eq("class_id", selectedClassId)
          .eq("status", "active");

      if (enrollmentError) {
        throw enrollmentError;
      }

      const studentIds = Array.from(
        new Set(
          (enrollmentData ?? [])
            .map((item) => item.student_id)
            .filter(Boolean)
        )
      );

      if (studentIds.length === 0) {
        setStudents([]);
        setAttendance({});
        return;
      }

      /* Student records */
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(`
          id,
          user_id,
          student_id,
          class_id,
          admission_number,
          full_name,
          profile_photo,
          status
        `)
        .in("id", studentIds)
        .eq("status", "active");

      if (studentsError) {
        throw studentsError;
      }

      const sortedStudents = ((studentsData ?? []) as Student[]).sort(
        (a, b) =>
          (a.full_name ?? "").localeCompare(b.full_name ?? "")
      );

      setStudents(sortedStudents);

      /* Existing attendance for selected date */
      const { data: attendanceData, error: attendanceError } =
        await supabase
          .from("attendance")
          .select(`
            id,
            student_id,
            session_id,
            term_id,
            attendance_date,
            present,
            note
          `)
          .eq("session_id", session.id)
          .eq("term_id", term?.id ?? "")
          .eq("attendance_date", selectedDate)
          .in("student_id", studentIds);

      if (attendanceError) {
        throw attendanceError;
      }

      const attendanceMap: Record<string, AttendanceState> = {};

      sortedStudents.forEach((student) => {
        attendanceMap[student.id] = {
          present: false,
          note: "",
        };
      });

      (attendanceData ?? []).forEach((record: AttendanceRecord) => {
        attendanceMap[record.student_id] = {
          present: record.present,
          note: record.note ?? "",
        };
      });

      setAttendance(attendanceMap);
    } catch (err) {
      console.error("STUDENT ATTENDANCE LOAD ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load students."
      );
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedClassId, selectedDate, session, term]);

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStaff();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadStaff]);

  useEffect(() => {
    if (staff) {
      const timeoutId = window.setTimeout(() => {
        void loadAcademicData();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [staff, loadAcademicData]);

  useEffect(() => {
    if (selectedClassId && session && term) {
      const timeoutId = window.setTimeout(() => {
        void loadStudents();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [
    selectedClassId,
    selectedDate,
    session,
    term,
    loadStudents,
  ]);

  /* =========================================================
     STAFF NAME
  ========================================================= */

  const staffName = useMemo(() => {
    if (!profile) return "Staff Member";

    const fullName = [
      profile.first_name,
      profile.middle_name,
      profile.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return fullName || "Staff Member";
  }, [profile]);

  const initials = useMemo(() => {
    if (!profile) return "ST";

    const first = profile.first_name?.charAt(0) ?? "";
    const last = profile.last_name?.charAt(0) ?? "";

    return `${first}${last}`.toUpperCase() || "ST";
  }, [profile]);

  /* =========================================================
     SELECTED CLASS
  ========================================================= */

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  );

  /* =========================================================
     FILTER STUDENTS
  ========================================================= */

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return students;

    return students.filter((student) => {
      const name = student.full_name?.toLowerCase() ?? "";
      const studentId = student.student_id?.toLowerCase() ?? "";
      const admission =
        student.admission_number?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        studentId.includes(query) ||
        admission.includes(query)
      );
    });
  }, [students, searchTerm]);

  /* =========================================================
     ATTENDANCE STATS
  ========================================================= */

  const attendanceStats = useMemo(() => {
    let present = 0;
    let absent = 0;

    students.forEach((student) => {
      if (attendance[student.id]?.present) {
        present += 1;
      } else {
        absent += 1;
      }
    });

    return {
      total: students.length,
      present,
      absent,
      percentage:
        students.length > 0
          ? Math.round((present / students.length) * 100)
          : 0,
    };
  }, [students, attendance]);

  /* =========================================================
     TOGGLE ATTENDANCE
  ========================================================= */

  const toggleAttendance = (studentId: string) => {
    setAttendance((current) => ({
      ...current,
      [studentId]: {
        present: !(current[studentId]?.present ?? false),
        note: current[studentId]?.note ?? "",
      },
    }));

    setSuccess("");
  };

  /* =========================================================
     UPDATE NOTE
  ========================================================= */

  const updateNote = (studentId: string, note: string) => {
    setAttendance((current) => ({
      ...current,
      [studentId]: {
        present: current[studentId]?.present ?? false,
        note,
      },
    }));
  };

  /* =========================================================
     MARK ALL PRESENT
  ========================================================= */

  const markAllPresent = () => {
    setAttendance((current) => {
      const updated = { ...current };

      students.forEach((student) => {
        updated[student.id] = {
          present: true,
          note: updated[student.id]?.note ?? "",
        };
      });

      return updated;
    });

    setSuccess("");
  };

  /* =========================================================
     MARK ALL ABSENT
  ========================================================= */

  const markAllAbsent = () => {
    setAttendance((current) => {
      const updated = { ...current };

      students.forEach((student) => {
        updated[student.id] = {
          present: false,
          note: updated[student.id]?.note ?? "",
        };
      });

      return updated;
    });

    setSuccess("");
  };

  /* =========================================================
     SAVE ATTENDANCE
  ========================================================= */

  const saveAttendance = async () => {
    if (!session || !term || !selectedClassId) {
      setError("Please select a class before saving attendance.");
      return;
    }

    if (students.length === 0) {
      setError("There are no active students in this class.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const records = students.map((student) => ({
        student_id: student.id,
        session_id: session.id,
        term_id: term.id,
        attendance_date: selectedDate,
        present: attendance[student.id]?.present ?? false,
        note: attendance[student.id]?.note?.trim() || null,
      }));

      const { error: saveError } = await supabase
        .from("attendance")
        .upsert(records, {
          onConflict: "student_id,attendance_date",
        });

      if (saveError) {
        throw saveError;
      }

      setSuccess(
        `Attendance for ${formatDate(
          selectedDate
        )} has been saved successfully.`
      );
    } catch (err) {
      console.error("SAVE ATTENDANCE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save attendance."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      await supabase.auth.signOut();

      router.replace("/staff-login");
    } catch (err) {
      console.error("LOGOUT ERROR:", err);

      setIsLoggingOut(false);
    }
  };

  /* =========================================================
     ACTIVE NAV
  ========================================================= */

  const isNavActive = (href: string) => {
    return (
      pathname === href ||
      (href !== "/staff-dashboard" &&
        pathname.startsWith(`${href}/`))
    );
  };

  /* =========================================================
     AUTH LOADING
  ========================================================= */

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: SCHOOL_BLUE }}
          >
            <Loader2
              className="animate-spin text-white"
              size={26}
            />
          </div>

          <p className="text-sm font-medium text-slate-600">
            Loading staff portal...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     AUTH ERROR
  ========================================================= */

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertCircle
              size={28}
              className="text-red-600"
            />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Staff Access Required
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {authError}
          </p>

          <button
            type="button"
            onClick={() => router.replace("/staff-login")}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: SCHOOL_BLUE }}
          >
            Return to Login
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     SIDEBAR
  ========================================================= */

  const renderSidebar = (mobile = false) => (
    <aside
      className={`${
        mobile
          ? "fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden"
          : "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[270px]"
      } flex flex-col border-r border-slate-200 bg-white`}
    >
      {/* Logo */}
      <div className="flex h-[82px] items-center border-b border-slate-100 px-5">
        <Link
          href="/staff-dashboard"
          className="flex items-center gap-3"
          onClick={() => setIsMobileMenuOpen(false)}
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
              Al-Irshad
            </p>

            <p className="truncate text-xs text-slate-500">
              Staff Portal
            </p>
          </div>
        </Link>

        {mobile && (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        )}
      </div>     

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Main Menu
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                style={
                  active
                    ? {
                        backgroundColor: SCHOOL_BLUE,
                      }
                    : undefined
                }
              >
                <Icon
                  size={19}
                  className={
                    active
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-700"
                  }
                />

                <span>{item.label}</span>

                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="my-6 h-px bg-slate-100" />

        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Account
        </p>

        <div className="space-y-1">
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                style={
                  active
                    ? {
                        backgroundColor: SCHOOL_BLUE,
                      }
                    : undefined
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
        >
          {isLoggingOut ? (
            <Loader2
              size={19}
              className="animate-spin"
            />
          ) : (
            <LogOut size={19} />
          )}

          <span>
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </span>
        </button>
      </div>
    </aside>
  );

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      {renderSidebar()}

      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      )}

      {/* Mobile sidebar */}
      {isMobileMenuOpen && renderSidebar(true)}

      {/* Main area */}
      <div className="lg:pl-[270px]">
        {/* ===================================================
            TOPBAR
        =================================================== */}
        <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Staff Portal
              </p>

              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                Attendance
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative hidden rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 sm:block"
            >
              <Bell size={19} />

              <span
                className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: SCHOOL_GOLD }}
              />
            </button>

            <Link
              href="/staff-dashboard/profile"
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={staffName}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: SCHOOL_BLUE }}
                >
                  {initials}
                </div>
              )}

              <div className="hidden text-left sm:block">
                <p className="max-w-[150px] truncate text-sm font-semibold text-slate-800">
                  {staffName}
                </p>

                <p className="text-[11px] text-slate-400">
                  {staff?.staff_id}
                </p>
              </div>

              <ChevronDown
                size={15}
                className="hidden text-slate-400 sm:block"
              />
            </Link>
          </div>
        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            {/* Page heading */}
            <div className="mb-7">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                    <Link
                      href="/staff-dashboard"
                      className="transition hover:text-slate-700"
                    >
                      Dashboard
                    </Link>

                    <ArrowRight size={13} />

                    <span>Attendance</span>
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Class Attendance
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Record and manage daily attendance for students in
                    your assigned classes.
                  </p>
                </div>

                {session && term && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Session
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-slate-800">
                        {session.name}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Term
                      </p>

                      <p className="mt-0.5 text-sm font-semibold capitalize text-slate-800">
                        {formatTerm(term.name)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-800">
                    Something went wrong
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-700">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="ml-auto rounded-lg p-1 text-red-500 hover:bg-red-100"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <p className="text-sm font-medium leading-6 text-emerald-700">
                  {success}
                </p>

                <button
                  type="button"
                  onClick={() => setSuccess("")}
                  className="ml-auto rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* =================================================
                CONTROLS
            ================================================= */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
                {/* Class */}
                <div>
                  <label
                    htmlFor="attendance-class"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    Class
                  </label>

                  <div className="relative">
                    <select
                      id="attendance-class"
                      value={selectedClassId}
                      onChange={(event) =>
                        setSelectedClassId(event.target.value)
                      }
                      disabled={
                        loadingData || classes.length === 0
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      {classes.length === 0 ? (
                        <option value="">
                          No assigned classes
                        </option>
                      ) : (
                        classes.map((item) => (
                          <option
                            key={item.id}
                            value={item.id}
                          >
                            {item.name}
                          </option>
                        ))
                      )}
                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label
                    htmlFor="attendance-date"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    Attendance Date
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="attendance-date"
                      type="date"
                      value={selectedDate}
                      onChange={(event) =>
                        setSelectedDate(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={markAllPresent}
                    disabled={students.length === 0 || loadingStudents}
                    className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 lg:flex-none"
                  >
                    All Present
                  </button>

                  <button
                    type="button"
                    onClick={markAllAbsent}
                    disabled={students.length === 0 || loadingStudents}
                    className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 lg:flex-none"
                  >
                    All Absent
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================
                STATS
            ================================================= */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Total Students"
                value={attendanceStats.total}
                icon={<Users size={20} />}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
              />

              <StatCard
                label="Present"
                value={attendanceStats.present}
                icon={<CheckCircle2 size={20} />}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
              />

              <StatCard
                label="Absent"
                value={attendanceStats.absent}
                icon={<X size={20} />}
                iconBg="bg-red-50"
                iconColor="text-red-600"
              />

              <StatCard
                label="Attendance Rate"
                value={`${attendanceStats.percentage}%`}
                icon={<ClipboardCheck size={20} />}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
              />
            </div>

            {/* =================================================
                ATTENDANCE CARD
            ================================================= */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Card header */}
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {selectedClass?.name || "Attendance List"}
                      </h3>

                      {term && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">
                          {formatTerm(term.name)} Term
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(selectedDate)}
                    </p>
                  </div>

                  {/* Search */}
                  <div className="relative w-full lg:max-w-xs">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                      placeholder="Search students..."
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Loading */}
              {loadingStudents || loadingData ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2
                      size={28}
                      className="animate-spin"
                      style={{ color: SCHOOL_BLUE }}
                    />

                    <p className="text-sm text-slate-500">
                      Loading attendance...
                    </p>
                  </div>
                </div>
              ) : students.length === 0 ? (
                /* Empty */
                <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                    <Users
                      size={28}
                      className="text-slate-400"
                    />
                  </div>

                  <h4 className="mt-5 text-base font-bold text-slate-800">
                    No students found
                  </h4>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    There are currently no active students enrolled
                    in this class for the selected academic session.
                  </p>
                </div>
              ) : filteredStudents.length === 0 ? (
                /* Search empty */
                <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <Search
                      size={24}
                      className="text-slate-400"
                    />
                  </div>

                  <h4 className="mt-4 text-base font-bold text-slate-800">
                    No matching students
                  </h4>

                  <p className="mt-2 text-sm text-slate-500">
                    Try searching by name, student ID, or admission
                    number.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                          <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Student
                          </th>

                          <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Student ID
                          </th>

                          <th className="px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Attendance
                          </th>

                          <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Note
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((student) => {
                          const record = attendance[student.id] ?? {
                            present: false,
                            note: "",
                          };

                          return (
                            <tr
                              key={student.id}
                              className="transition hover:bg-slate-50/70"
                            >
                              {/* Student */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {student.profile_photo ? (
                                    <img
                                      src={student.profile_photo}
                                      alt={
                                        student.full_name ||
                                        "Student"
                                      }
                                      className="h-10 w-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div
                                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                      style={{
                                        backgroundColor:
                                          SCHOOL_BLUE,
                                      }}
                                    >
                                      {(
                                        student.full_name
                                          ?.split(" ")
                                          .map((part) =>
                                            part.charAt(0)
                                          )
                                          .slice(0, 2)
                                          .join("") || "ST"
                                      ).toUpperCase()}
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {student.full_name ||
                                        "Unnamed Student"}
                                    </p>

                                    {student.admission_number && (
                                      <p className="mt-0.5 text-xs text-slate-400">
                                        {student.admission_number}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Student ID */}
                              <td className="px-4 py-4">
                                <span className="text-sm font-medium text-slate-600">
                                  {student.student_id}
                                </span>
                              </td>

                              {/* Toggle */}
                              <td className="px-4 py-4">
                                <div className="flex justify-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleAttendance(
                                        student.id
                                      )
                                    }
                                    className={`flex min-w-[112px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                                      record.present
                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                        : "bg-red-100 text-red-700 hover:bg-red-200"
                                    }`}
                                  >
                                    {record.present ? (
                                      <>
                                        <Check size={16} />
                                        Present
                                      </>
                                    ) : (
                                      <>
                                        <X size={16} />
                                        Absent
                                      </>
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Note */}
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  value={record.note}
                                  onChange={(event) =>
                                    updateNote(
                                      student.id,
                                      event.target.value
                                    )
                                  }
                                  placeholder="Optional note"
                                  className="w-full min-w-[180px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {filteredStudents.map((student) => {
                      const record = attendance[student.id] ?? {
                        present: false,
                        note: "",
                      };

                      return (
                        <div
                          key={student.id}
                          className="p-4 sm:p-5"
                        >
                          <div className="flex items-center gap-3">
                            {student.profile_photo ? (
                              <Image
                                src={student.profile_photo}
                                alt={
                                  student.full_name ||
                                  "Student"
                                }
                                width={44}
                                height={44}
                                className="h-11 w-11 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                style={{
                                  backgroundColor:
                                    SCHOOL_BLUE,
                                }}
                              >
                                {(
                                  student.full_name
                                    ?.split(" ")
                                    .map((part) =>
                                      part.charAt(0)
                                    )
                                    .slice(0, 2)
                                    .join("") || "ST"
                                ).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {student.full_name ||
                                  "Unnamed Student"}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {student.student_id}
                                {student.admission_number
                                  ? ` • ${student.admission_number}`
                                  : ""}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                toggleAttendance(student.id)
                              }
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                                record.present
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-red-100 text-red-700 hover:bg-red-200"
                              }`}
                              aria-label={
                                record.present
                                  ? "Mark absent"
                                  : "Mark present"
                              }
                            >
                              {record.present ? (
                                <Check size={18} />
                              ) : (
                                <X size={18} />
                              )}
                            </button>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                record.present
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {record.present
                                ? "Present"
                                : "Absent"}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                toggleAttendance(student.id)
                              }
                              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                            >
                              Change
                            </button>
                          </div>

                          <div className="mt-3">
                            <input
                              type="text"
                              value={record.note}
                              onChange={(event) =>
                                updateNote(
                                  student.id,
                                  event.target.value
                                )
                              }
                              placeholder="Add an optional note..."
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Save footer */}
              {students.length > 0 && (
                <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Ready to save attendance?
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {attendanceStats.present} present ·{" "}
                      {attendanceStats.absent} absent ·{" "}
                      {attendanceStats.total} students
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={saveAttendance}
                    disabled={saving || loadingStudents}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      backgroundColor: SCHOOL_BLUE,
                    }}
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Save Attendance
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* =================================================
                FOOTER INFO
            ================================================= */}
            <div className="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Al-Irshad Model School · Staff Attendance Portal
              </p>

              <p>
                {session?.name || "Academic Session"} ·{" "}
                {term ? formatTerm(term.name) : "Current Term"}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}
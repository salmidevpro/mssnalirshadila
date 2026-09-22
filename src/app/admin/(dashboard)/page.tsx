"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  Loader2,
  RefreshCw,
  School,
  Users,
  UserRoundCheck,
  UserRoundX,
  Wallet,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Session = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
};

type Term = {
  id: string;
  session_id: string;
  name: "first" | "second" | "third";
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
};

type Student = {
  id: string;
  user_id: string;
  student_id: string;
  class_id: string | null;
  admission_date: string | null;
  status: "active" | "inactive" | "graduated" | "suspended";
  full_name: string | null;
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
  email: string | null;
};

type ClassRow = {
  id: string;
  name: string;
  education_level_id: string | null;
};

type EducationLevel = {
  id: string;
  name: string;
};

type Course = {
  id: string;
  code: string;
  name: string;
  class_id: string | null;
  units: number;
  is_active: boolean;
};

type Enrollment = {
  id: string;
  student_id: string;
  session_id: string;
  class_id: string;
  status: string;
  enrollment_date: string;
};

type Result = {
  id: string;
  student_id: string;
  course_id: string;
  session_id: string;
  term_id: string;
  ca_score: number;
  exam_score: number;
  total_score: number | null;
  grade: string | null;
  remark: string | null;
  published: boolean;
};

type Attendance = {
  id: string;
  student_id: string;
  session_id: string;
  term_id: string;
  attendance_date: string;
  present: boolean;
};

type Assignment = {
  id: string;
  course_id: string;
  teacher_id: string | null;
  session_id: string;
  term_id: string;
  title: string;
  due_date: string | null;
  max_score: number;
  status: "draft" | "published" | "closed";
};

type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  score: number | null;
  status: "submitted" | "graded" | "late";
  submitted_at: string;
};

type CourseTeacher = {
  id: string;
  course_id: string;
  teacher_id: string;
  session_id: string;
  term_id: string;
};

type EventRow = {
  id: string;
  title: string;
  event_type: string;
  start_date: string;
  end_date: string | null;
  is_published: boolean;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

type Bill = {
  id: string;
  student_id: string;
  session_id: string;
  term_id: string;
  status: string;
};

type BillItem = {
  id: string;
  bill_id: string;
  fee_name: string;
  amount: number;
  amount_paid: number;
};

type Payment = {
  id: string;
  student_id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
};

type DashboardData = {
  sessions: Session[];
  terms: Term[];
  students: Student[];
  staff: Staff[];
  profiles: Profile[];
  classes: ClassRow[];
  levels: EducationLevel[];
  courses: Course[];
  enrollments: Enrollment[];
  results: Result[];
  attendance: Attendance[];
  assignments: Assignment[];
  submissions: Submission[];
  courseTeachers: CourseTeacher[];
  events: EventRow[];
  announcements: Announcement[];
  bills: Bill[];
  billItems: BillItem[];
  payments: Payment[];
};

const emptyData: DashboardData = {
  sessions: [],
  terms: [],
  students: [],
  staff: [],
  profiles: [],
  classes: [],
  levels: [],
  courses: [],
  enrollments: [],
  results: [],
  attendance: [],
  assignments: [],
  submissions: [],
  courseTeachers: [],
  events: [],
  announcements: [],
  bills: [],
  billItems: [],
  payments: [],
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-NG").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatShortDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function getTodayKey() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function getGrade(score: number) {
  if (score >= 70) return "A";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 45) return "D";
  if (score >= 40) return "E";
  return "F";
}

function gradeDescription(grade: string) {
  const descriptions: Record<string, string> = {
    A: "Excellent",
    B: "Very Good",
    C: "Good",
    D: "Fair",
    E: "Pass",
    F: "Fail",
  };

  return descriptions[grade] ?? "—";
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  href,
  trend,
  trendLabel,
  iconClass = "bg-blue-50 text-blue-700",
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  href?: string;
  trend?: number;
  trendLabel?: string;
  iconClass?: string;
}) {
  const content = (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} strokeWidth={2} />
        </div>
      </div>

      {typeof trend === "number" && (
        <div className="relative mt-4 flex items-center gap-2 text-xs">
          {trend >= 0 ? (
            <ArrowUpRight size={14} className="text-emerald-600" />
          ) : (
            <ArrowDownRight size={14} className="text-red-600" />
          )}

          <span
            className={
              trend >= 0
                ? "font-semibold text-emerald-600"
                : "font-semibold text-red-600"
            }
          >
            {Math.abs(trend)}%
          </span>

          <span className="text-slate-400">{trendLabel}</span>
        </div>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View details",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-blue-700">
            {eyebrow}
          </p>
        )}

        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          {linkLabel}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

function ProgressBar({
  value,
  label,
  count,
  suffix = "%",
}: {
  value: number;
  label: string;
  count?: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>

        <span className="text-slate-500">
          {count !== undefined ? `${formatNumber(count)} · ` : ""}
          {Math.round(value)}
          {suffix}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${clamp(value)}%` }}
        />
      </div>
    </div>
  );
}

function MiniSparkline({
  values,
}: {
  values: number[];
}) {
  if (!values.length) {
    return (
      <div className="flex h-12 items-center justify-center text-xs text-slate-400">
        No trend data
      </div>
    );
  }

  const width = 180;
  const height = 48;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values
    .map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : (index / (values.length - 1)) * width;

      const y = height - ((value - min) / range) * (height - 8) - 4;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-12 w-full"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-blue-600"
      />
    </svg>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-45 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
        <Icon size={20} />
      </div>

      <p className="text-sm font-semibold text-slate-700">{title}</p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const supabase = useMemo(() => createClient(), []);

  const [data, setData] = useState<DashboardData>(emptyData);

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [currentTime] = useState(() => Date.now());

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        setError("");

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [
          sessionsResponse,
          termsResponse,
          studentsResponse,
          staffResponse,
          profilesResponse,
          classesResponse,
          levelsResponse,
          coursesResponse,
        ] = await Promise.all([
          supabase
            .from("academic_sessions")
            .select("id,name,start_date,end_date,is_current")
            .order("start_date", { ascending: false }),

          supabase
            .from("academic_terms")
            .select(
              "id,session_id,name,start_date,end_date,is_current"
            )
            .order("created_at", { ascending: false }),

          supabase
            .from("students")
            .select(
              "id,user_id,student_id,class_id,admission_date,status,full_name"
            )
            .order("created_at", { ascending: false }),

          supabase
            .from("staff")
            .select(
              "id,user_id,staff_id,department,position,status"
            ),

          supabase
            .from("profiles")
            .select("id,first_name,last_name,email"),

          supabase
            .from("classes")
            .select("id,name,education_level_id")
            .order("name"),

          supabase
            .from("education_levels")
            .select("id,name")
            .order("name"),

          supabase
            .from("courses")
            .select("id,code,name,class_id,units,is_active")
            .order("name"),
        ]);

        const firstError =
          sessionsResponse.error ||
          termsResponse.error ||
          studentsResponse.error ||
          staffResponse.error ||
          profilesResponse.error ||
          classesResponse.error ||
          levelsResponse.error ||
          coursesResponse.error;

        if (firstError) {
          throw new Error(firstError.message);
        }

        const sessions = (sessionsResponse.data ?? []) as Session[];
        const terms = (termsResponse.data ?? []) as Term[];
        const students = (studentsResponse.data ?? []) as Student[];
        const staff = (staffResponse.data ?? []) as Staff[];
        const profiles = (profilesResponse.data ?? []) as Profile[];
        const classes = (classesResponse.data ?? []) as ClassRow[];
        const levels = (levelsResponse.data ?? []) as EducationLevel[];
        const courses = (coursesResponse.data ?? []) as Course[];

        const currentSession =
          sessions.find((session) => session.is_current) ??
          sessions[0] ??
          null;

        const currentTerm =
          terms.find(
            (term) =>
              term.is_current &&
              (!currentSession || term.session_id === currentSession.id)
          ) ??
          terms.find(
            (term) =>
              currentSession && term.session_id === currentSession.id
          ) ??
          terms[0] ??
          null;

        const sessionId =
          selectedSessionId || currentSession?.id || "";

        const sessionTerms = terms.filter(
          (term) => term.session_id === sessionId
        );

        const termId =
          selectedTermId &&
          sessionTerms.some((term) => term.id === selectedTermId)
            ? selectedTermId
            : sessionTerms.find((term) => term.is_current)?.id ??
              sessionTerms[0]?.id ??
              "";

        if (
          !selectedSessionId &&
          currentSession?.id &&
          currentSession.id !== selectedSessionId
        ) {
          setSelectedSessionId(currentSession.id);
        }

        if (
          !selectedTermId &&
          termId &&
          termId !== selectedTermId
        ) {
          setSelectedTermId(termId);
        }

        const [
          enrollmentsResponse,
          resultsResponse,
          attendanceResponse,
          assignmentsResponse,
          submissionsResponse,
          courseTeachersResponse,
          eventsResponse,
          announcementsResponse,
          billsResponse,
          paymentsResponse,
        ] = await Promise.all([
          sessionId
            ? supabase
                .from("student_enrollments")
                .select(
                  "id,student_id,session_id,class_id,status,enrollment_date"
                )
                .eq("session_id", sessionId)
            : Promise.resolve({ data: [], error: null }),

          sessionId && termId
            ? supabase
                .from("results")
                .select(
                  "id,student_id,course_id,session_id,term_id,ca_score,exam_score,total_score,grade,remark,published"
                )
                .eq("session_id", sessionId)
                .eq("term_id", termId)
            : Promise.resolve({ data: [], error: null }),

          sessionId && termId
            ? supabase
                .from("attendance")
                .select(
                  "id,student_id,session_id,term_id,attendance_date,present"
                )
                .eq("session_id", sessionId)
                .eq("term_id", termId)
                .order("attendance_date", { ascending: true })
            : Promise.resolve({ data: [], error: null }),

          sessionId && termId
            ? supabase
                .from("assignments")
                .select(
                  "id,course_id,teacher_id,session_id,term_id,title,due_date,max_score,status"
                )
                .eq("session_id", sessionId)
                .eq("term_id", termId)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [], error: null }),

          supabase
            .from("submissions")
            .select(
              "id,assignment_id,student_id,score,status,submitted_at"
            )
            .order("submitted_at", { ascending: false }),

          sessionId && termId
            ? supabase
                .from("course_teachers")
                .select(
                  "id,course_id,teacher_id,session_id,term_id"
                )
                .eq("session_id", sessionId)
                .eq("term_id", termId)
            : Promise.resolve({ data: [], error: null }),

          sessionId
            ? supabase
                .from("academic_events")
                .select(
                  "id,title,event_type,start_date,end_date,is_published"
                )
                .eq("session_id", sessionId)
                .order("start_date", { ascending: true })
            : Promise.resolve({ data: [], error: null }),

          supabase
            .from("announcements")
            .select(
              "id,title,content,is_published,published_at,created_at"
            )
            .order("created_at", { ascending: false })
            .limit(10),

          sessionId && termId
            ? supabase
                .from("student_bills")
                .select(
                  "id,student_id,session_id,term_id,status"
                )
                .eq("session_id", sessionId)
                .eq("term_id", termId)
            : Promise.resolve({ data: [], error: null }),

          sessionId && termId
            ? supabase
                .from("payments")
                .select(
                  "id,student_id,amount,status,paid_at,created_at"
                )
                .eq("session_id", sessionId)
                .eq("term_id", termId)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [], error: null }),
        ]);

        const secondError =
          enrollmentsResponse.error ||
          resultsResponse.error ||
          attendanceResponse.error ||
          assignmentsResponse.error ||
          submissionsResponse.error ||
          courseTeachersResponse.error ||
          eventsResponse.error ||
          announcementsResponse.error ||
          billsResponse.error ||
          paymentsResponse.error;

        if (secondError) {
          throw new Error(secondError.message);
        }

        const bills = (billsResponse.data ?? []) as Bill[];

        let billItems: BillItem[] = [];

        if (bills.length) {
          const billIds = bills.map((bill) => bill.id);

          const billItemsResponse = await supabase
            .from("student_bill_items")
            .select(
              "id,bill_id,fee_name,amount,amount_paid"
            )
            .in("bill_id", billIds);

          if (billItemsResponse.error) {
            throw new Error(billItemsResponse.error.message);
          }

          billItems = (billItemsResponse.data ?? []) as BillItem[];
        }

        setData({
          sessions,
          terms,
          students,
          staff,
          profiles,
          classes,
          levels,
          courses,
          enrollments: (enrollmentsResponse.data ??
            []) as Enrollment[],
          results: (resultsResponse.data ?? []) as Result[],
          attendance: (attendanceResponse.data ??
            []) as Attendance[],
          assignments: (assignmentsResponse.data ??
            []) as Assignment[],
          submissions: (submissionsResponse.data ??
            []) as Submission[],
          courseTeachers: (courseTeachersResponse.data ??
            []) as CourseTeacher[],
          events: (eventsResponse.data ?? []) as EventRow[],
          announcements: (announcementsResponse.data ??
            []) as Announcement[],
          bills,
          billItems,
          payments: (paymentsResponse.data ??
            []) as Payment[],
        });
      } catch (err) {
        console.error("Dashboard error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedSessionId, selectedTermId, supabase]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  const currentSession = useMemo(
    () =>
      data.sessions.find(
        (session) => session.id === selectedSessionId
      ) ??
      data.sessions.find((session) => session.is_current) ??
      data.sessions[0] ??
      null,
    [data.sessions, selectedSessionId]
  );

  const currentTerm = useMemo(
    () =>
      data.terms.find((term) => term.id === selectedTermId) ??
      data.terms.find(
        (term) =>
          term.is_current &&
          term.session_id === currentSession?.id
      ) ??
      data.terms.find(
        (term) => term.session_id === currentSession?.id
      ) ??
      null,
    [data.terms, selectedTermId, currentSession?.id]
  );

  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return data.students;

    return data.students.filter(
      (student) => student.class_id === selectedClassId
    );
  }, [data.students, selectedClassId]);

  const filteredEnrollments = useMemo(() => {
    if (!selectedClassId) return data.enrollments;

    return data.enrollments.filter(
      (enrollment) => enrollment.class_id === selectedClassId
    );
  }, [data.enrollments, selectedClassId]);

  const activeStudents = useMemo(
    () =>
      filteredStudents.filter(
        (student) => student.status === "active"
      ),
    [filteredStudents]
  );

  const activeStaff = useMemo(
    () =>
      data.staff.filter(
        (member) => member.status === "active"
      ),
    [data.staff]
  );

  const activeCourses = useMemo(
    () => data.courses.filter((course) => course.is_active),
    [data.courses]
  );

  const filteredResults = useMemo(() => {
    if (!selectedClassId) return data.results;

    const studentIds = new Set(
      filteredStudents.map((student) => student.id)
    );

    return data.results.filter((result) =>
      studentIds.has(result.student_id)
    );
  }, [data.results, filteredStudents, selectedClassId]);

  const filteredAttendance = useMemo(() => {
    if (!selectedClassId) return data.attendance;

    const studentIds = new Set(
      filteredStudents.map((student) => student.id)
    );

    return data.attendance.filter((record) =>
      studentIds.has(record.student_id)
    );
  }, [data.attendance, filteredStudents, selectedClassId]);

  const filteredAssignments = useMemo(() => {
    if (!selectedClassId) return data.assignments;

    const courseIds = new Set(
      activeCourses
        .filter((course) => course.class_id === selectedClassId)
        .map((course) => course.id)
    );

    return data.assignments.filter((assignment) =>
      courseIds.has(assignment.course_id)
    );
  }, [data.assignments, selectedClassId, activeCourses]);

  const gradeDistribution = useMemo(() => {
    const grades = ["A", "B", "C", "D", "E", "F"];

    return grades.map((grade) => ({
      grade,
      count: filteredResults.filter(
        (result) => result.grade === grade
      ).length,
    }));
  }, [filteredResults]);

  const averageScore = useMemo(() => {
    const scores = filteredResults
      .map((result) => Number(result.total_score))
      .filter((score) => Number.isFinite(score));

    if (!scores.length) return 0;

    return (
      scores.reduce((sum, score) => sum + score, 0) /
      scores.length
    );
  }, [filteredResults]);

  const passCount = useMemo(
    () =>
      filteredResults.filter(
        (result) => Number(result.total_score) >= 40
      ).length,
    [filteredResults]
  );

  const failCount = filteredResults.filter(
    (result) => Number(result.total_score) < 40
  ).length;

  const publishedResults = filteredResults.filter(
    (result) => result.published
  ).length;

  const attendanceRate = useMemo(() => {
    if (!filteredAttendance.length) return 0;

    const present = filteredAttendance.filter(
      (record) => record.present
    ).length;

    return percentage(present, filteredAttendance.length);
  }, [filteredAttendance]);

  const todayAttendance = useMemo(() => {
    const today = getTodayKey();

    const records = filteredAttendance.filter(
      (record) => record.attendance_date === today
    );

    const present = records.filter(
      (record) => record.present
    ).length;

    return {
      total: records.length,
      present,
      absent: records.length - present,
      rate: percentage(present, records.length),
    };
  }, [filteredAttendance]);

  const attendanceTrend = useMemo(() => {
    const grouped = new Map<string, { present: number; total: number }>();

    filteredAttendance.forEach((record) => {
      const existing = grouped.get(record.attendance_date) ?? {
        present: 0,
        total: 0,
      };

      existing.total += 1;

      if (record.present) {
        existing.present += 1;
      }

      grouped.set(record.attendance_date, existing);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10)
      .map(([date, value]) => ({
        date,
        rate: percentage(value.present, value.total),
      }));
  }, [filteredAttendance]);

  const studentsByClass = useMemo(() => {
    return data.classes
      .map((classItem) => {
        const students = filteredStudents.filter(
          (student) => student.class_id === classItem.id
        );

        return {
          id: classItem.id,
          name: classItem.name,
          count: students.length,
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [data.classes, filteredStudents]);

  const studentsByLevel = useMemo(() => {
    return data.levels
      .map((level) => {
        const classIds = new Set(
          data.classes
            .filter(
              (classItem) =>
                classItem.education_level_id === level.id
            )
            .map((classItem) => classItem.id)
        );

        const count = filteredStudents.filter(
          (student) =>
            student.class_id &&
            classIds.has(student.class_id)
        ).length;

        return {
          id: level.id,
          name: level.name,
          count,
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [data.levels, data.classes, filteredStudents]);

  const assignedCourseIds = useMemo(
    () =>
      new Set(
        data.courseTeachers.map(
          (assignment) => assignment.course_id
        )
      ),
    [data.courseTeachers]
  );

  const assignedCourses = activeCourses.filter((course) =>
    assignedCourseIds.has(course.id)
  );

  const unassignedCourses = activeCourses.filter(
    (course) => !assignedCourseIds.has(course.id)
  );

  const upcomingAssignments = useMemo(() => {
    if (currentTime === null) return [];

    return filteredAssignments
      .filter(
        (assignment) =>
          assignment.due_date &&
          new Date(assignment.due_date).getTime() >= currentTime &&
          assignment.status === "published"
      )
      .sort(
        (a, b) =>
          new Date(a.due_date!).getTime() -
          new Date(b.due_date!).getTime()
      )
      .slice(0, 5);
  }, [filteredAssignments, currentTime]);

  const submissionStats = useMemo(() => {
    const assignmentIds = new Set(
      filteredAssignments.map((assignment) => assignment.id)
    );

    const submissions = data.submissions.filter((submission) =>
      assignmentIds.has(submission.assignment_id)
    );

    return {
      total: submissions.length,
      graded: submissions.filter(
        (submission) => submission.status === "graded"
      ).length,
      pending: submissions.filter(
        (submission) => submission.status !== "graded"
      ).length,
    };
  }, [data.submissions, filteredAssignments]);

  const totalBilled = useMemo(
    () =>
      data.billItems.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [data.billItems]
  );

  const totalCollected = useMemo(
    () =>
      data.billItems.reduce(
        (sum, item) => sum + Number(item.amount_paid || 0),
        0
      ),
    [data.billItems]
  );

  const outstandingFees = Math.max(
    totalBilled - totalCollected,
    0
  );

  const collectionRate = percentage(
    totalCollected,
    totalBilled
  );

  const today = getTodayKey();

  const upcomingEvents = data.events
    .filter(
      (event) =>
        event.is_published && event.start_date >= today
    )
    .sort((a, b) =>
      a.start_date.localeCompare(b.start_date)
    )
    .slice(0, 5);

  const publishedAnnouncements = data.announcements.filter(
    (announcement) => announcement.is_published
  );

  const recentAdmissions = filteredStudents
    .filter((student) => student.admission_date)
    .sort((a, b) =>
      String(b.admission_date).localeCompare(
        String(a.admission_date)
      )
    )
    .slice(0, 5);

  const studentsWithoutRegistration = filteredStudents.filter(
    (student) =>
      !filteredEnrollments.some(
        (enrollment) =>
          enrollment.student_id === student.id
      )
  );

  const incompleteProfiles = filteredStudents.filter(
    (student) =>
      !student.full_name ||
      !student.admission_date ||
      !student.class_id
  );

  const resultStudentIds = new Set(
    filteredResults.map((result) => result.student_id)
  );

  const studentsWithoutResults = filteredStudents.filter(
    (student) => !resultStudentIds.has(student.id)
  );

  const classPerformance = useMemo(() => {
    return data.classes
      .map((classItem) => {
        const studentIds = new Set(
          filteredStudents
            .filter(
              (student) => student.class_id === classItem.id
            )
            .map((student) => student.id)
        );

        const results = filteredResults.filter((result) =>
          studentIds.has(result.student_id)
        );

        const scores = results
          .map((result) => Number(result.total_score))
          .filter((score) => Number.isFinite(score));

        const average = scores.length
          ? scores.reduce((sum, score) => sum + score, 0) /
            scores.length
          : 0;

        return {
          id: classItem.id,
          name: classItem.name,
          students: studentIds.size,
          results: results.length,
          average,
        };
      })
      .filter((item) => item.students > 0)
      .sort((a, b) => b.average - a.average);
  }, [data.classes, filteredStudents, filteredResults]);

  const teacherWorkload = useMemo(() => {
    return data.staff
      .map((teacher) => {
        const courses = data.courseTeachers.filter(
          (assignment) =>
            assignment.teacher_id === teacher.id
        );

        return {
          id: teacher.id,
          name:
            data.profiles.find(
              (profile) => profile.id === teacher.user_id
            )?.first_name ?? "Staff",
          courses: courses.length,
        };
      })
      .filter((teacher) => teacher.courses > 0)
      .sort((a, b) => b.courses - a.courses);
  }, [data.staff, data.courseTeachers, data.profiles]);

  const maxClassCount = Math.max(
    ...studentsByClass.map((item) => item.count),
    1
  );

  const maxLevelCount = Math.max(
    ...studentsByLevel.map((item) => item.count),
    1
  );

  const maxGradeCount = Math.max(
    ...gradeDistribution.map((item) => item.count),
    1
  );

  const maxTeacherCourses = Math.max(
    ...teacherWorkload.map((item) => item.courses),
    1
  );

  const selectedSessionTerms = data.terms.filter(
    (term) => term.session_id === selectedSessionId
  );

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-blue-600" size={32} />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading administration dashboard...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Reading live school data
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle size={26} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Dashboard could not load
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-10">
      {/* HEADER */}
      <section>
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <Activity size={14} />
              Administration Command Center
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              School Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor students, academics, attendance, teaching,
              assessments and school operations from one place.
            </p>
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => loadDashboard(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh data"}
          </button>
        </div>

        {/* FILTERS */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Academic session
              </span>

              <select
                value={selectedSessionId}
                onChange={(event) => {
                  setSelectedSessionId(event.target.value);
                  setSelectedTermId("");
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                {data.sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                    {session.is_current ? " — Current" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Academic term
              </span>

              <select
                value={selectedTermId}
                onChange={(event) =>
                  setSelectedTermId(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium capitalize text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                {selectedSessionTerms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name} Term
                    {term.is_current ? " — Current" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Class
              </span>

              <select
                value={selectedClassId}
                onChange={(event) =>
                  setSelectedClassId(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All classes</option>

                {data.classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* CURRENT PERIOD */}
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl">
        <div className="relative p-6 sm:p-7">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                Current academic period
              </p>

              <h2 className="mt-2 text-2xl font-bold capitalize">
                {currentSession?.name ?? "No session configured"}
              </h2>

              <p className="mt-1 capitalize text-sm text-slate-300">
                {currentTerm
                  ? `${currentTerm.name} Term`
                  : "No term configured"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  Students
                </p>
                <p className="mt-1 text-xl font-bold">
                  {formatNumber(activeStudents.length)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  Teachers
                </p>
                <p className="mt-1 text-xl font-bold">
                  {formatNumber(activeStaff.length)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  Subjects
                </p>
                <p className="mt-1 text-xl font-bold">
                  {formatNumber(activeCourses.length)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  Classes
                </p>
                <p className="mt-1 text-xl font-bold">
                  {formatNumber(data.classes.length)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXECUTIVE METRICS */}
      <section>
        <SectionHeader
          eyebrow="Executive overview"
          title="School at a glance"
          description="Live operational indicators for the selected academic period."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total students"
            value={formatNumber(activeStudents.length)}
            description={`${formatNumber(filteredStudents.length)} records in view`}
            icon={Users}
            href="/admin/students"
            iconClass="bg-blue-50 text-blue-700"
          />

          <StatCard
            label="Teaching staff"
            value={formatNumber(activeStaff.length)}
            description={`${formatNumber(data.staff.length)} staff records`}
            icon={GraduationCap}
            href="/admin/teachers"
            iconClass="bg-emerald-50 text-emerald-700"
          />

          <StatCard
            label="Active subjects"
            value={formatNumber(activeCourses.length)}
            description={`${formatNumber(unassignedCourses.length)} need assignment`}
            icon={BookOpen}
            href="/admin/subjects"
            iconClass="bg-violet-50 text-violet-700"
          />

          <StatCard
            label="Attendance rate"
            value={`${attendanceRate}%`}
            description={`${formatNumber(filteredAttendance.length)} attendance records`}
            icon={ClipboardCheck}
            href="/admin/attendance"
            iconClass="bg-amber-50 text-amber-700"
          />
        </div>
      </section>

      {/* STUDENT ANALYTICS */}
      <section>
        <SectionHeader
          eyebrow="Student analytics"
          title="Student population"
          description="Understand how the current student population is distributed across the school."
          href="/admin/students"
        />

        <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Students by class
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Current student distribution
                </p>
              </div>

              <School size={19} className="text-blue-600" />
            </div>

            {studentsByClass.length ? (
              <div className="space-y-4">
                {studentsByClass.slice(0, 8).map((item) => (
                  <ProgressBar
                    key={item.id}
                    label={item.name}
                    count={item.count}
                    value={(item.count / maxClassCount) * 100}
                    suffix=""
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No class distribution yet"
                description="Student class assignments will appear here once students are assigned to classes."
              />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="font-bold text-slate-900">
                Education levels
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Student population by level
              </p>
            </div>

            {studentsByLevel.length ? (
              <div className="space-y-5">
                {studentsByLevel.map((item) => (
                  <div key={item.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {item.name}
                      </span>

                      <span className="text-sm font-bold text-slate-900">
                        {formatNumber(item.count)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{
                          width: `${
                            (item.count / maxLevelCount) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={School}
                title="No level data"
                description="Education-level distribution will appear after students are assigned to classes."
              />
            )}
          </div>
        </div>
      </section>

      {/* ACADEMIC PERFORMANCE */}
      <section>
        <SectionHeader
          eyebrow="Academic intelligence"
          title="Academic performance"
          description="Results, grades and overall academic performance for the selected term."
          href="/admin/results"
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Average score
                </p>

                <p className="mt-2 text-4xl font-bold text-slate-950">
                  {averageScore.toFixed(1)}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Across {formatNumber(filteredResults.length)} result
                  records
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                <BarChart3 size={21} />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-emerald-700">
                  Passed
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  {formatNumber(passCount)}
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  {percentage(passCount, filteredResults.length)}%
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-xs font-semibold text-red-700">
                  Failed
                </p>
                <p className="mt-1 text-2xl font-bold text-red-800">
                  {formatNumber(failCount)}
                </p>
                <p className="mt-1 text-xs text-red-700">
                  {percentage(failCount, filteredResults.length)}%
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Published results
                </span>

                <span className="font-bold text-slate-900">
                  {formatNumber(publishedResults)} /{" "}
                  {formatNumber(filteredResults.length)}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${percentage(
                      publishedResults,
                      filteredResults.length
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-6">
              <h3 className="font-bold text-slate-900">
                Grade distribution
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Results grouped by calculated grade
              </p>
            </div>

            {filteredResults.length ? (
              <div className="grid grid-cols-6 gap-3">
                {gradeDistribution.map((item) => (
                  <div
                    key={item.grade}
                    className="flex flex-col items-center"
                  >
                    <div className="flex h-40 w-full items-end justify-center rounded-xl bg-slate-50 p-2">
                      <div
                        className="w-full max-w-8 rounded-lg bg-blue-600 transition-all duration-500"
                        style={{
                          height: `${
                            Math.max(
                              (item.count / maxGradeCount) * 100,
                              item.count ? 8 : 2
                            )
                          }%`,
                        }}
                      />
                    </div>

                    <div className="mt-3 text-lg font-bold text-slate-900">
                      {item.grade}
                    </div>

                    <div className="text-xs text-slate-500">
                      {item.count}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No result data"
                description="Grade analytics will populate automatically when results are entered for the selected term."
              />
            )}

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              {["A", "B", "C", "D", "E", "F"].map((grade) => (
                <span key={grade}>
                  <strong className="text-slate-800">
                    {grade}
                  </strong>{" "}
                  — {gradeDescription(grade)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CLASS PERFORMANCE */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="font-bold text-slate-900">
              Performance by class
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Average calculated result score for each class with student data.
            </p>
          </div>

          {classPerformance.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-162.5 text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-3 font-semibold">Class</th>
                    <th className="pb-3 font-semibold">Students</th>
                    <th className="pb-3 font-semibold">Results</th>
                    <th className="pb-3 font-semibold">Average</th>
                    <th className="pb-3 font-semibold">Performance</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {classPerformance.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 font-semibold text-slate-800">
                        {item.name}
                      </td>

                      <td className="py-4 text-sm text-slate-600">
                        {item.students}
                      </td>

                      <td className="py-4 text-sm text-slate-600">
                        {item.results}
                      </td>

                      <td className="py-4 font-bold text-slate-900">
                        {item.results
                          ? item.average.toFixed(1)
                          : "—"}
                      </td>

                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{
                                width: `${clamp(
                                  item.average
                                )}%`,
                              }}
                            />
                          </div>

                          <span className="text-xs font-semibold text-slate-500">
                            {item.results
                              ? `${Math.round(
                                  item.average
                                )}%`
                              : "No results"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={School}
              title="No class performance data"
              description="Once students and results are available, class performance will be shown here."
            />
          )}
        </div>
      </section>

      {/* ATTENDANCE */}
      <section>
        <SectionHeader
          eyebrow="Attendance intelligence"
          title="Attendance monitoring"
          description="Track today's attendance and recent attendance behaviour."
          href="/admin/attendance"
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <UserRoundCheck size={17} />
                  <span className="text-xs font-semibold">
                    Present today
                  </span>
                </div>

                <p className="mt-3 text-3xl font-bold text-emerald-900">
                  {formatNumber(todayAttendance.present)}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <UserRoundX size={17} />
                  <span className="text-xs font-semibold">
                    Absent today
                  </span>
                </div>

                <p className="mt-3 text-3xl font-bold text-red-900">
                  {formatNumber(todayAttendance.absent)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Today&apos;s attendance
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatNumber(todayAttendance.total)} records
                  </p>
                </div>

                <p className="text-xl font-bold text-slate-900">
                  {todayAttendance.rate}%
                </p>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${todayAttendance.rate}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Recent attendance trend
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Attendance percentage over recent recorded dates
                </p>
              </div>

              <ClipboardCheck
                size={19}
                className="text-emerald-600"
              />
            </div>

            {attendanceTrend.length ? (
              <>
                <div className="rounded-xl bg-slate-50 p-4">
                  <MiniSparkline
                    values={attendanceTrend.map(
                      (item) => item.rate
                    )}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {attendanceTrend.slice(-4).map((item) => (
                    <div
                      key={item.date}
                      className="rounded-xl border border-slate-100 p-3"
                    >
                      <p className="text-[11px] text-slate-400">
                        {formatShortDate(item.date)}
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {item.rate}%
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="No attendance trend yet"
                description="Attendance trends will appear after attendance records are entered."
              />
            )}
          </div>
        </div>
      </section>

      {/* TEACHING */}
      <section>
        <SectionHeader
          eyebrow="Teaching & curriculum"
          title="Teaching coverage"
          description="Monitor subject coverage and teacher workload."
          href="/admin/teachers"
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-blue-50 p-4">
                <BookOpen
                  size={19}
                  className="text-blue-700"
                />

                <p className="mt-4 text-2xl font-bold text-slate-900">
                  {activeCourses.length}
                </p>

                <p className="text-xs text-slate-500">
                  Active subjects
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <CheckCircle2
                  size={19}
                  className="text-emerald-700"
                />

                <p className="mt-4 text-2xl font-bold text-slate-900">
                  {assignedCourses.length}
                </p>

                <p className="text-xs text-slate-500">
                  Assigned subjects
                </p>
              </div>
            </div>

            <div className="mt-5">
              <ProgressBar
                label="Subject assignment coverage"
                value={percentage(
                  assignedCourses.length,
                  activeCourses.length
                )}
              />
            </div>

            {unassignedCourses.length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />

                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      {unassignedCourses.length} subjects need attention
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      Some active subjects do not currently have a
                      teacher assignment for this academic period.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="font-bold text-slate-900">
                Teacher workload
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Course assignments by teacher
              </p>
            </div>

            {teacherWorkload.length ? (
              <div className="space-y-4">
                {teacherWorkload.slice(0, 8).map((teacher) => (
                  <div key={teacher.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                          {getInitials(teacher.name)}
                        </div>

                        <span className="text-sm font-semibold text-slate-800">
                          {teacher.name}
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-slate-500">
                        {teacher.courses} subject
                        {teacher.courses === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="ml-12 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${
                            (teacher.courses /
                              maxTeacherCourses) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="No teaching assignments"
                description="Teacher workload will appear after subjects are assigned to staff."
              />
            )}
          </div>
        </div>
      </section>

      {/* ASSIGNMENTS */}
      <section>
        <SectionHeader
          eyebrow="Assessment activity"
          title="Assignments & submissions"
          description="Keep track of published work, deadlines and submission activity."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total assignments
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {filteredAssignments.length}
                </p>
              </div>

              <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                <BookOpen size={20} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-xs text-blue-700">
                  Published
                </p>
                <p className="mt-1 text-xl font-bold text-blue-900">
                  {
                    filteredAssignments.filter(
                      (assignment) =>
                        assignment.status === "published"
                    ).length
                  }
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-600">
                  Drafts
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {
                    filteredAssignments.filter(
                      (assignment) =>
                        assignment.status === "draft"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Submission activity
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {submissionStats.total}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Total submissions
            </p>

            <div className="mt-5 space-y-3">
              <ProgressBar
                label="Graded"
                value={percentage(
                  submissionStats.graded,
                  submissionStats.total
                )}
                count={submissionStats.graded}
              />

              <ProgressBar
                label="Pending"
                value={percentage(
                  submissionStats.pending,
                  submissionStats.total
                )}
                count={submissionStats.pending}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Upcoming deadlines
            </p>

            {upcomingAssignments.length ? (
              <div className="mt-4 space-y-3">
                {upcomingAssignments.slice(0, 4).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-0.5 rounded-lg bg-amber-50 p-2 text-amber-700">
                      <Clock3 size={15} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {assignment.title}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Due {formatDate(assignment.due_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  icon={Clock3}
                  title="No upcoming deadlines"
                  description="Published assignments with future due dates will appear here."
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FINANCE */}
      <section>
        <SectionHeader
          eyebrow="Financial overview"
          title="School fee monitoring"
          description="Financial figures below come directly from billing and payment records."
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-700">
                  Total billed
                </p>

                <p className="mt-2 text-2xl font-bold text-blue-950">
                  {formatCurrency(totalBilled)}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-emerald-700">
                  Total collected
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-950">
                  {formatCurrency(totalCollected)}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-xs font-semibold text-amber-700">
                  Outstanding
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-950">
                  {formatCurrency(outstandingFees)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {totalBilled > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Collection progress
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Payments received against billed fees
                    </p>
                  </div>

                  <Wallet className="text-emerald-600" size={21} />
                </div>

                <div className="mt-8 flex items-end gap-4">
                  <p className="text-5xl font-bold text-slate-950">
                    {collectionRate}%
                  </p>

                  <p className="pb-1 text-sm text-slate-500">
                    collected
                  </p>
                </div>

                <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${collectionRate}%`,
                    }}
                  />
                </div>
              </>
            ) : (
              <EmptyState
                icon={CircleDollarSign}
                title="No billing records yet"
                description="Financial analytics will become available automatically once student bills or payment records are created."
              />
            )}
          </div>
        </div>
      </section>

      {/* EVENTS + ANNOUNCEMENTS */}
      <section>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              eyebrow="School calendar"
              title="Upcoming events"
              description="Published academic events for the selected session."
            />

            {upcomingEvents.length ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-4 rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <span className="text-[9px] font-bold uppercase">
                        {new Date(event.start_date).toLocaleDateString(
                          "en-NG",
                          { month: "short" }
                        )}
                      </span>

                      <span className="text-lg font-bold leading-none">
                        {new Date(event.start_date).getDate()}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">
                        {event.title}
                      </p>

                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {event.event_type.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming events"
                description="Published school events will appear here when they are scheduled."
              />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              eyebrow="Communication"
              title="Recent announcements"
              description="Latest published school announcements."
            />

            {publishedAnnouncements.length ? (
              <div className="space-y-3">
                {publishedAnnouncements.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-800">
                        {item.title}
                      </p>

                      <span className="shrink-0 text-[11px] text-slate-400">
                        {formatShortDate(
                          item.published_at ??
                            item.created_at
                        )}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Activity}
                title="No announcements yet"
                description="Published announcements will appear here for quick administrative visibility."
              />
            )}
          </div>
        </div>
      </section>

      {/* RECENT ADMISSIONS */}
      <section>
        <SectionHeader
          eyebrow="Admissions"
          title="Recent student records"
          description="Latest student admission records available in the selected view."
          href="/admin/students"
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {recentAdmissions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-162.5 text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-3 font-semibold">Student</th>
                    <th className="pb-3 font-semibold">Student ID</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Admission date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentAdmissions.map((student) => (
                    <tr key={student.id}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                            {getInitials(
                              student.full_name ??
                                student.student_id
                            )}
                          </div>

                          <span className="font-semibold text-slate-800">
                            {student.full_name ??
                              "Unnamed student"}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 text-sm text-slate-500">
                        {student.student_id}
                      </td>

                      <td className="py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                          {student.status}
                        </span>
                      </td>

                      <td className="py-4 text-sm text-slate-500">
                        {formatDate(student.admission_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No admission records"
              description="Recent admissions will appear here as student records are created."
            />
          )}
        </div>
      </section>

      {/* ATTENTION CENTER */}
      <section>
        <SectionHeader
          eyebrow="Action center"
          title="Things that need attention"
          description="These indicators are generated from actual data inconsistencies or incomplete records."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/admin/subjects"
            className="group rounded-2xl border border-amber-200 bg-amber-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <AlertCircle
              size={21}
              className="text-amber-700"
            />

            <p className="mt-5 text-3xl font-bold text-amber-950">
              {unassignedCourses.length}
            </p>

            <p className="mt-1 text-sm font-semibold text-amber-900">
              Unassigned subjects
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-800">
              Active subjects without a teacher assignment.
            </p>

            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-800">
              Review
              <ChevronRight size={14} />
            </span>
          </Link>

          <Link
            href="/admin/students"
            className="group rounded-2xl border border-red-200 bg-red-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <UserRoundX size={21} className="text-red-700" />

            <p className="mt-5 text-3xl font-bold text-red-950">
              {studentsWithoutRegistration.length}
            </p>

            <p className="mt-1 text-sm font-semibold text-red-900">
              Missing enrollment
            </p>

            <p className="mt-1 text-xs leading-5 text-red-800">
              Students without an enrollment record for this session.
            </p>

            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-red-800">
              Review
              <ChevronRight size={14} />
            </span>
          </Link>

          <Link
            href="/admin/results"
            className="group rounded-2xl border border-violet-200 bg-violet-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <BarChart3 size={21} className="text-violet-700" />

            <p className="mt-5 text-3xl font-bold text-violet-950">
              {studentsWithoutResults.length}
            </p>

            <p className="mt-1 text-sm font-semibold text-violet-900">
              Students without results
            </p>

            <p className="mt-1 text-xs leading-5 text-violet-800">
              Students who currently have no result record.
            </p>

            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-violet-800">
              Review
              <ChevronRight size={14} />
            </span>
          </Link>

          <Link
            href="/admin/profile"
            className="group rounded-2xl border border-blue-200 bg-blue-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <AlertCircle size={21} className="text-blue-700" />

            <p className="mt-5 text-3xl font-bold text-blue-950">
              {incompleteProfiles.length}
            </p>

            <p className="mt-1 text-sm font-semibold text-blue-900">
              Incomplete profiles
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-800">
              Student records missing one or more core profile fields.
            </p>

            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-800">
              Review
              <ChevronRight size={14} />
            </span>
          </Link>
        </div>
      </section>

      {/* SYSTEM STATUS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <p className="font-semibold text-slate-800">
                Dashboard data connection active
              </p>

              <p className="text-xs text-slate-500">
                Metrics are being read directly from the school database.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
              {data.sessions.length} sessions
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
              {data.classes.length} classes
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
              {data.courses.length} courses
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
              {data.students.length} students
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
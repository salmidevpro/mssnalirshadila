"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  RefreshCw,
  School,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

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

type Course = {
  id: string;
  code: string;
  name: string;
};

type Assignment = {
  id: string;
  course_id: string;
  session_id: string;
  term_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
  status: string;
  course: Course | Course[] | null;
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: "assignment";
  assignmentId: string;
  courseName: string;
  courseCode: string;
  maxScore: number;
  status: string;
};

type Student = {
  id: string;
};

/* =====================================================
   HELPERS
===================================================== */

function getCourse(
  course: Course | Course[] | null,
): Course | null {
  if (Array.isArray(course)) {
    return course[0] ?? null;
  }

  return course;
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0",
  );
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function isSameDate(
  first: Date,
  second: Date,
) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function formatDate(
  date: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    options ?? {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(new Date(date));
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

/* =====================================================
   PAGE
===================================================== */

export default function StudentAcademicCalendarPage() {
  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const [student, setStudent] =
    useState<Student | null>(null);

  const [session, setSession] =
    useState<AcademicSession | null>(null);

  const [term, setTerm] =
    useState<AcademicTerm | null>(null);

  const [assignments, setAssignments] =
    useState<Assignment[]>([]);

  const [currentMonth, setCurrentMonth] =
    useState(() => {
      const today = new Date();

      return new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
    });

  const [selectedDate, setSelectedDate] =
    useState(() => getDateKey(new Date()));

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [refreshing, setRefreshing] =
    useState(false);

  /* =====================================================
     LOAD CALENDAR DATA
  ====================================================== */

  const loadCalendar = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        /* -------------------------------------------------
           AUTH USER
        -------------------------------------------------- */

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw new Error(authError.message);
        }

        if (!user) {
          throw new Error(
            "You are not logged in.",
          );
        }

        /* -------------------------------------------------
           STUDENT
        -------------------------------------------------- */

        const {
          data: studentData,
          error: studentError,
        } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (studentError) {
          throw new Error(
            `Unable to load student record: ${studentError.message}`,
          );
        }

        if (!studentData) {
          throw new Error(
            "Your student record could not be found.",
          );
        }

        /* -------------------------------------------------
           CURRENT SESSION
        -------------------------------------------------- */

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase
          .from("academic_sessions")
          .select(
            "id, name, is_current",
          )
          .eq("is_current", true)
          .maybeSingle();

        if (sessionError) {
          throw new Error(
            `Unable to load academic session: ${sessionError.message}`,
          );
        }

        if (!sessionData) {
          throw new Error(
            "No current academic session has been configured.",
          );
        }

        /* -------------------------------------------------
           CURRENT TERM
        -------------------------------------------------- */

        const {
          data: termData,
          error: termError,
        } = await supabase
          .from("academic_terms")
          .select(
            "id, name, session_id, is_current",
          )
          .eq(
            "session_id",
            sessionData.id,
          )
          .eq("is_current", true)
          .maybeSingle();

        if (termError) {
          throw new Error(
            `Unable to load academic term: ${termError.message}`,
          );
        }

        /* -------------------------------------------------
           COURSE REGISTRATIONS
        -------------------------------------------------- */

        const {
          data: registrations,
          error: registrationError,
        } = await supabase
          .from("course_registrations")
          .select(
            `
              course_id,
              session_id,
              term_id
            `,
          )
          .eq(
            "student_id",
            studentData.id,
          )
          .eq(
            "session_id",
            sessionData.id,
          )
          .eq(
            "term_id",
            termData?.id ?? "",
          );

        if (registrationError) {
          throw new Error(
            `Unable to load your registered courses: ${registrationError.message}`,
          );
        }

        /* -------------------------------------------------
           NO REGISTERED COURSES
        -------------------------------------------------- */

        if (
          !registrations ||
          registrations.length === 0
        ) {
          setStudent(studentData);
          setSession(sessionData);
          setTerm(termData ?? null);
          setAssignments([]);

          return;
        }

        const courseIds =
          registrations.map(
            (registration) =>
              registration.course_id,
          );

        /* -------------------------------------------------
           ASSIGNMENTS
        -------------------------------------------------- */

        const {
          data: assignmentData,
          error: assignmentError,
        } = await supabase
          .from("assignments")
          .select(
            `
              id,
              course_id,
              session_id,
              term_id,
              title,
              description,
              due_date,
              max_score,
              status,
              course:courses (
                id,
                code,
                name
              )
            `,
          )
          .in(
            "course_id",
            courseIds,
          )
          .eq(
            "session_id",
            sessionData.id,
          )
          .eq(
            "term_id",
            termData?.id ?? "",
          )
          .eq(
            "status",
            "published",
          )
          .not(
            "due_date",
            "is",
            null,
          )
          .order(
            "due_date",
            {
              ascending: true,
            },
          );

        if (assignmentError) {
          throw new Error(
            `Unable to load assignment dates: ${assignmentError.message}`,
          );
        }

        setStudent(studentData);
        setSession(sessionData);
        setTerm(termData ?? null);
        setAssignments(
          assignmentData ?? [],
        );
      } catch (err) {
        console.error(
          "Academic calendar error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load academic calendar.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase],
  );

  /* =====================================================
     INITIAL LOAD
  ====================================================== */

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  /* =====================================================
     CALENDAR EVENTS
  ====================================================== */

  const events = useMemo<CalendarEvent[]>(
    () =>
      assignments
        .filter(
          (assignment) =>
            !!assignment.due_date,
        )
        .map((assignment) => {
          const course = getCourse(
            assignment.course,
          );

          return {
            id: assignment.id,
            title: assignment.title,
            date: getDateKey(
              new Date(
                assignment.due_date!,
              ),
            ),
            type: "assignment",
            assignmentId: assignment.id,
            courseName:
              course?.name ??
              "Academic Course",
            courseCode:
              course?.code ?? "",
            maxScore:
              assignment.max_score,
            status: assignment.status,
          };
        }),
    [assignments],
  );

  /* =====================================================
     CALENDAR DAYS
  ====================================================== */

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );

    const lastDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );

    /*
      JavaScript:
      Sunday = 0
      Monday = 1
      ...
      Saturday = 6

      We want Monday as the first
      day of the calendar.
    */

    const startingDay =
      firstDay.getDay() === 0
        ? 6
        : firstDay.getDay() - 1;

    const daysInMonth =
      lastDay.getDate();

    const previousMonthLastDay =
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        0,
      ).getDate();

    const days: {
      date: Date;
      currentMonth: boolean;
    }[] = [];

    /* Previous month */

    for (
      let i = startingDay - 1;
      i >= 0;
      i--
    ) {
      days.push({
        date: new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() - 1,
          previousMonthLastDay - i,
        ),
        currentMonth: false,
      });
    }

    /* Current month */

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      days.push({
        date: new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          day,
        ),
        currentMonth: true,
      });
    }

    /* Next month */

    let nextDay = 1;

    while (days.length < 42) {
      days.push({
        date: new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          nextDay,
        ),
        currentMonth: false,
      });

      nextDay++;
    }

    return days;
  }, [currentMonth]);

  /* =====================================================
     SELECTED EVENTS
  ====================================================== */

  const selectedEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.date === selectedDate,
      ),
    [events, selectedDate],
  );

  /* =====================================================
     UPCOMING EVENTS
  ====================================================== */

  const upcomingEvents = useMemo(() => {
    const todayKey = getDateKey(
      new Date(),
    );

    return events
      .filter(
        (event) =>
          event.date >= todayKey,
      )
      .sort((a, b) =>
        a.date.localeCompare(
          b.date,
        ),
      )
      .slice(0, 5);
  }, [events]);

  /* =====================================================
     NAVIGATION
  ====================================================== */

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
    const today = new Date();

    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    );

    setSelectedDate(
      getDateKey(today),
    );
  };

  /* =====================================================
     LOADING
  ====================================================== */

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <section className="border-b border-slate-200 bg-white px-5 py-7 sm:px-8 sm:py-9">
          <div className="animate-pulse">
            <div className="h-3 w-32 rounded bg-slate-200" />

            <div className="mt-4 h-9 w-72 rounded bg-slate-200" />

            <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100" />
          </div>
        </section>

        <main className="px-5 py-7 sm:px-8 sm:py-9">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="h-28 animate-pulse rounded-3xl bg-white" />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="h-[620px] animate-pulse rounded-3xl bg-white" />

              <div className="h-[620px] animate-pulse rounded-3xl bg-white" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ====================================================== */

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <CalendarDays size={24} />
          </div>

          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
            Calendar Error
          </p>

          <h1
            className="mt-2 text-xl font-black"
            style={{
              color: SCHOOL_BLUE_DARK,
            }}
          >
            Unable to load calendar
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                void loadCalendar(
                  true,
                )
              }
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
              style={{
                backgroundColor:
                  SCHOOL_BLUE,
              }}
            >
              <RefreshCw size={15} />
              Try Again
            </button>

            <Link
              href="/student-dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={15} />
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ====================================================== */

  return (
    <div className="min-h-full bg-slate-50">
      {/* =================================================
          HEADER
      ================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <Link
            href="/student-dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold transition hover:opacity-70"
            style={{
              color: SCHOOL_BLUE,
            }}
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className="text-[10px] font-black uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                Academic Planning
              </p>

              <h1
                className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Academic Calendar
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Keep track of important academic dates,
                assignment deadlines and your current
                school term.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadCalendar(
                  true,
                )
              }
              disabled={refreshing}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* =================================================
          MAIN
      ================================================== */}

      <main className="px-5 py-7 sm:px-8 sm:py-9">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* =================================================
              SESSION / TERM SUMMARY
          ================================================== */}

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)]">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SCHOOL_BLUE}08`,
                    color: SCHOOL_BLUE,
                  }}
                >
                  <School size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Academic Session
                  </p>

                  <p
                    className="mt-1 truncate text-sm font-black"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    {session?.name ??
                      "No current session"}
                  </p>
                </div>

                {session?.is_current && (
                  <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-600">
                    Current
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)]">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SCHOOL_GOLD}15`,
                    color: SCHOOL_GOLD,
                  }}
                >
                  <GraduationCap size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Current Term
                  </p>

                  <p
                    className="mt-1 truncate text-sm font-black"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    {term?.name ??
                      "No current term"}
                  </p>
                </div>

                {term?.is_current && (
                  <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-600">
                    Current
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* =================================================
              CALENDAR + EVENTS
          ================================================== */}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* =================================================
                CALENDAR
            ================================================== */}

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(1,0,102,0.035)]">
              {/* Calendar Header */}

              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Calendar
                    </p>

                    <h2
                      className="mt-1 text-xl font-black"
                      style={{
                        color:
                          SCHOOL_BLUE_DARK,
                      }}
                    >
                      {formatMonth(
                        currentMonth,
                      )}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={
                        goToToday
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 transition hover:bg-slate-50"
                    >
                      Today
                    </button>

                    <button
                      type="button"
                      onClick={
                        goToPreviousMonth
                      }
                      aria-label="Previous month"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                    >
                      <ArrowLeft
                        size={15}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={
                        goToNextMonth
                      }
                      aria-label="Next month"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                    >
                      <ArrowRight
                        size={15}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Weekdays */}

              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70">
                {[
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                  "Sun",
                ].map((day) => (
                  <div
                    key={day}
                    className="px-1 py-3 text-center text-[9px] font-black uppercase tracking-wider text-slate-400 sm:px-2"
                  >
                    <span className="sm:hidden">
                      {day.charAt(
                        0,
                      )}
                    </span>

                    <span className="hidden sm:inline">
                      {day}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}

              <div className="grid grid-cols-7">
                {calendarDays.map(
                  ({
                    date,
                    currentMonth:
                      isCurrentMonth,
                  }) => {
                    const dateKey =
                      getDateKey(
                        date,
                      );

                    const dayEvents =
                      events.filter(
                        (event) =>
                          event.date ===
                          dateKey,
                      );

                    const isToday =
                      isSameDate(
                        date,
                        new Date(),
                      );

                    const isSelected =
                      dateKey ===
                      selectedDate;

                    return (
                      <button
                        type="button"
                        key={dateKey}
                        onClick={() =>
                          setSelectedDate(
                            dateKey,
                          )
                        }
                        className={`relative min-h-20 border-b border-r border-slate-100 p-1.5 text-left transition sm:min-h-24 sm:p-2 ${
                          !isCurrentMonth
                            ? "bg-slate-50/50"
                            : "bg-white"
                        } ${
                          isSelected
                            ? "bg-[#010066]/[0.025]"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Day Number */}

                        <div className="flex items-center justify-between">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black ${
                              isToday
                                ? "text-white"
                                : isCurrentMonth
                                  ? "text-slate-700"
                                  : "text-slate-300"
                            }`}
                            style={
                              isToday
                                ? {
                                    backgroundColor:
                                      SCHOOL_BLUE,
                                  }
                                : undefined
                            }
                          >
                            {date.getDate()}
                          </span>

                          {dayEvents.length >
                            0 && (
                            <span
                              className="mr-1 h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  SCHOOL_GOLD,
                              }}
                            />
                          )}
                        </div>

                        {/* Events */}

                        <div className="mt-2 space-y-1">
                          {dayEvents
                            .slice(0, 2)
                            .map(
                              (
                                event,
                              ) => (
                                <div
                                  key={
                                    event.id
                                  }
                                  className="truncate rounded-md px-1.5 py-1 text-[8px] font-bold sm:text-[9px]"
                                  style={{
                                    backgroundColor: `${SCHOOL_BLUE}08`,
                                    color: SCHOOL_BLUE,
                                  }}
                                  title={
                                    event.title
                                  }
                                >
                                  <span className="hidden sm:inline">
                                    {event.title}
                                  </span>

                                  <span className="sm:hidden">
                                    Assignment
                                  </span>
                                </div>
                              ),
                            )}

                          {dayEvents.length >
                            2 && (
                            <p className="px-1 text-[8px] font-bold text-slate-400">
                              +
                              {dayEvents.length -
                                2}{" "}
                              more
                            </p>
                          )}
                        </div>

                        {/* Selected Indicator */}

                        {isSelected && (
                          <span
                            className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full"
                            style={{
                              backgroundColor:
                                SCHOOL_GOLD,
                            }}
                          />
                        )}
                      </button>
                    );
                  },
                )}
              </div>

              {/* Legend */}

              <div className="flex flex-wrap items-center gap-5 border-t border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        SCHOOL_GOLD,
                    }}
                  />

                  <span className="text-[10px] font-semibold text-slate-400">
                    Assignment deadline
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        SCHOOL_BLUE,
                    }}
                  />

                  <span className="text-[10px] font-semibold text-slate-400">
                    Today
                  </span>
                </div>
              </div>
            </section>

            {/* =================================================
                RIGHT SIDE
            ================================================== */}

            <aside className="space-y-5">
              {/* SELECTED DATE */}

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-6">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${SCHOOL_BLUE}08`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    <CalendarDays
                      size={18}
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Selected Date
                    </p>

                    <h2
                      className="mt-1 text-sm font-black"
                      style={{
                        color:
                          SCHOOL_BLUE_DARK,
                      }}
                    >
                      {formatDate(
                        selectedDate,
                      )}
                    </h2>
                  </div>
                </div>

                <div className="mt-5">
                  {selectedEvents.length ===
                  0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                      <CheckCircle2
                        size={20}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-3 text-xs font-bold text-slate-500">
                        No academic deadlines
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-400">
                        Nothing is scheduled for
                        this date.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedEvents.map(
                        (event) => (
                          <Link
                            key={
                              event.id
                            }
                            href={`/student-dashboard/assignments/${event.assignmentId}`}
                            className="group block rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#010066]/15 hover:shadow-md"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                style={{
                                  backgroundColor: `${SCHOOL_BLUE}08`,
                                  color: SCHOOL_BLUE,
                                }}
                              >
                                <FileText
                                  size={
                                    16
                                  }
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                  Assignment
                                </p>

                                <h3 className="mt-1 text-xs font-black leading-5 text-slate-700">
                                  {
                                    event.title
                                  }
                                </h3>

                                <p className="mt-1 truncate text-[10px] font-semibold text-slate-400">
                                  {
                                    event.courseName
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                              <span
                                className="text-[9px] font-black"
                                style={{
                                  color:
                                    SCHOOL_BLUE,
                                }}
                              >
                                {event.courseCode}
                              </span>

                              <span className="text-[9px] font-bold text-slate-400">
                                Max{" "}
                                {
                                  event.maxScore
                                }
                              </span>
                            </div>
                          </Link>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* UPCOMING */}

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Coming Up
                    </p>

                    <h2
                      className="mt-1 text-sm font-black"
                      style={{
                        color:
                          SCHOOL_BLUE_DARK,
                      }}
                    >
                      Upcoming Deadlines
                    </h2>
                  </div>

                  <Clock3
                    size={18}
                    className="text-slate-300"
                  />
                </div>

                <div className="mt-5">
                  {upcomingEvents.length ===
                  0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                      <CheckCircle2
                        size={20}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-3 text-xs font-bold text-slate-500">
                        You're all caught up
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-400">
                        No upcoming assignment
                        deadlines.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {upcomingEvents.map(
                        (
                          event,
                        ) => (
                          <Link
                            key={
                              event.id
                            }
                            href={`/student-dashboard/assignments/${event.assignmentId}`}
                            className="group flex items-start gap-3 rounded-2xl p-3 transition hover:bg-slate-50"
                          >
                            <div
                              className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl"
                              style={{
                                backgroundColor: `${SCHOOL_BLUE}08`,
                                color: SCHOOL_BLUE,
                              }}
                            >
                              <span className="text-[8px] font-black uppercase">
                                {new Intl.DateTimeFormat(
                                  "en-GB",
                                  {
                                    month:
                                      "short",
                                  },
                                )
                                  .format(
                                    parseDateKey(
                                      event.date,
                                    ),
                                  )
                                  .slice(
                                    0,
                                    3,
                                  )}
                              </span>

                              <span className="text-xs font-black">
                                {parseDateKey(
                                  event.date,
                                ).getDate()}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-black text-slate-700">
                                {
                                  event.title
                                }
                              </p>

                              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                {
                                  event.courseName
                                }
                              </p>

                              <p
                                className="mt-1 text-[9px] font-black"
                                style={{
                                  color:
                                    SCHOOL_BLUE,
                                }}
                              >
                                {formatDate(
                                  event.date,
                                  {
                                    day: "numeric",
                                    month:
                                      "short",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            </div>

                            <ArrowRight
                              size={14}
                              className="mt-2 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                            />
                          </Link>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* INFO */}

              <section
                className="relative overflow-hidden rounded-3xl p-5 sm:p-6"
                style={{
                  backgroundColor:
                    SCHOOL_BLUE,
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl"
                  style={{
                    backgroundColor: `${SCHOOL_GOLD}22`,
                  }}
                />

                <div className="relative z-10">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">
                    Academic Overview
                  </p>

                  <h3 className="mt-2 text-base font-black text-white">
                    Stay ahead of your school work.
                  </h3>

                  <p className="mt-2 text-[10px] leading-5 text-white/55">
                    Assignment deadlines published
                    by your teachers automatically
                    appear on your academic calendar.
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${SCHOOL_GOLD}18`,
                        color: SCHOOL_GOLD,
                      }}
                    >
                      <FileText
                        size={13}
                      />
                    </div>

                    <span className="text-[10px] font-bold text-white/70">
                      {events.length}{" "}
                      published{" "}
                      {events.length ===
                      1
                        ? "assignment"
                        : "assignments"}{" "}
                      with deadlines
                    </span>
                  </div>
                </div>
              </section>
            </aside>
          </div>

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="pb-5 text-center">
            <Link
              href="/student-dashboard"
              className="text-xs font-bold transition hover:opacity-70"
              style={{
                color: SCHOOL_BLUE,
              }}
            >
              Back to Student Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Session = {
  id: string;
  name: string;
  is_current: boolean;
};

type Term = {
  id: string;
  session_id: string;
  name: "first" | "second" | "third";
  is_current: boolean;
};

type AcademicEvent = {
  id: string;
  session_id: string;
  term_id: string | null;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_all_day: boolean;
  is_published: boolean;
};

const supabase = createClient();

const eventTypes = [
  { value: "school_event", label: "School Event" },
  { value: "exam", label: "Examination" },
  { value: "test", label: "Test" },
  { value: "holiday", label: "Holiday" },
  { value: "meeting", label: "Meeting" },
  { value: "resumption", label: "Resumption" },
  { value: "deadline", label: "Deadline" },
  { value: "result_release", label: "Result Release" },
  { value: "pta", label: "PTA" },
  { value: "other", label: "Other" },
];

function formatDate(date: string | null) {
  if (!date) return "Not set";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEventType(type: string) {
  return (
    eventTypes.find((item) => item.value === type)?.label ||
    "School Event"
  );
}

function getEventBadge(type: string) {
  switch (type) {
    case "exam":
      return "bg-red-50 text-red-700";

    case "test":
      return "bg-orange-50 text-orange-700";

    case "holiday":
      return "bg-purple-50 text-purple-700";

    case "meeting":
      return "bg-blue-50 text-blue-700";

    case "resumption":
      return "bg-emerald-50 text-emerald-700";

    case "deadline":
      return "bg-amber-50 text-amber-700";

    case "result_release":
      return "bg-cyan-50 text-cyan-700";

    case "pta":
      return "bg-pink-50 text-pink-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function AdminCalendarPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [session, setSession] = useState<Session | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [events, setEvents] = useState<AcademicEvent[]>([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] =
    useState<AcademicEvent | null>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "school_event",
    term_id: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    location: "",
    is_all_day: true,
    is_published: true,
  });

  useEffect(() => {
    loadCalendar();
  }, []);

  async function loadCalendar() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      // Verify admin/developer
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setError("We couldn't verify your account.");
        return;
      }

      if (
        profile.role !== "admin" &&
        profile.role !== "developer"
      ) {
        setError(
          "You do not have permission to manage the academic calendar."
        );
        return;
      }

      // Current session
      const { data: currentSession, error: sessionError } =
        await supabase
          .from("academic_sessions")
          .select("id, name, is_current")
          .eq("is_current", true)
          .maybeSingle();

      if (sessionError || !currentSession) {
        setError("No current academic session was found.");
        return;
      }

      setSession(currentSession);

      // Terms
      const { data: sessionTerms, error: termError } =
        await supabase
          .from("academic_terms")
          .select(
            "id, session_id, name, is_current"
          )
          .eq("session_id", currentSession.id)
          .order("name");

      if (termError) {
        setError("We couldn't load the academic terms.");
        return;
      }

      setTerms(sessionTerms || []);

      // Events
      const { data: calendarEvents, error: eventsError } =
        await supabase
          .from("academic_events")
          .select("*")
          .eq("session_id", currentSession.id)
          .order("start_date", { ascending: true })
          .order("start_time", { ascending: true });

      if (eventsError) {
        console.error(eventsError);
        setError("We couldn't load academic events.");
        return;
      }

      setEvents(calendarEvents || []);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while loading the calendar.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      title: "",
      description: "",
      event_type: "school_event",
      term_id: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      location: "",
      is_all_day: true,
      is_published: true,
    });

    setEditingEvent(null);
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
    setSuccess("");
    setError("");
  }

  function openEdit(event: AcademicEvent) {
    setEditingEvent(event);

    setForm({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      term_id: event.term_id || "",
      start_date: event.start_date,
      end_date: event.end_date || "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      location: event.location || "",
      is_all_day: event.is_all_day,
      is_published: event.is_published,
    });

    setShowForm(true);
    setSuccess("");
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!session) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!form.title.trim()) {
        setError("Please enter an event title.");
        return;
      }

      if (!form.start_date) {
        setError("Please select a start date.");
        return;
      }

      if (
        form.end_date &&
        new Date(form.end_date) <
          new Date(form.start_date)
      ) {
        setError(
          "The end date cannot be earlier than the start date."
        );
        return;
      }

      const payload = {
        session_id: session.id,
        term_id: form.term_id || null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_type: form.event_type,
        start_date: form.start_date,
        end_date: form.end_date || null,
        start_time: form.is_all_day
          ? null
          : form.start_time || null,
        end_time: form.is_all_day
          ? null
          : form.end_time || null,
        location: form.location.trim() || null,
        is_all_day: form.is_all_day,
        is_published: form.is_published,
      };

      if (editingEvent) {
        const { error: updateError } = await supabase
          .from("academic_events")
          .update(payload)
          .eq("id", editingEvent.id);

        if (updateError) {
          console.error(updateError);
          setError("We couldn't update this event.");
          return;
        }

        setSuccess("Academic event updated successfully.");
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { error: insertError } = await supabase
          .from("academic_events")
          .insert({
            ...payload,
            created_by: user?.id || null,
          });

        if (insertError) {
          console.error(insertError);
          setError("We couldn't create this event.");
          return;
        }

        setSuccess("Academic event created successfully.");
      }

      setShowForm(false);
      resetForm();

      await loadCalendar();
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(event: AcademicEvent) {
    const confirmed = window.confirm(
      `Delete "${event.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("academic_events")
      .delete()
      .eq("id", event.id);

    if (deleteError) {
      console.error(deleteError);
      setError("We couldn't delete this event.");
      return;
    }

    setSuccess("Academic event deleted.");
    await loadCalendar();
  }

  async function togglePublished(event: AcademicEvent) {
    const { error: updateError } = await supabase
      .from("academic_events")
      .update({
        is_published: !event.is_published,
      })
      .eq("id", event.id);

    if (updateError) {
      console.error(updateError);
      setError("We couldn't update the event status.");
      return;
    }

    await loadCalendar();
  }

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        !search ||
        event.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        event.description
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesType =
        filterType === "all" ||
        event.event_type === filterType;

      return matchesSearch && matchesType;
    });
  }, [events, search, filterType]);

  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = (firstDay.getDay() + 6) % 7;

    const days: Array<Date | null> = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [selectedMonth]);

  function eventsForDay(date: Date) {
    return events.filter((event) => {
      const start = new Date(
        `${event.start_date}T00:00:00`
      );

      const end = event.end_date
        ? new Date(`${event.end_date}T23:59:59`)
        : start;

      return date >= start && date <= end;
    });
  }

  function changeMonth(amount: number) {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + amount,
        1
      )
    );
  }

  const monthLabel = selectedMonth.toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

  const publishedCount = events.filter(
    (event) => event.is_published
  ).length;

  const upcomingCount = events.filter((event) => {
    const date = new Date(
      `${event.start_date}T00:00:00`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date >= today;
  }).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-10 w-72 rounded-xl bg-slate-200" />
          <div className="h-5 w-96 rounded bg-slate-200" />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-28 rounded-2xl bg-white" />
            <div className="h-28 rounded-2xl bg-white" />
            <div className="h-28 rounded-2xl bg-white" />
          </div>

          <div className="h-[500px] rounded-2xl bg-white" />
        </div>
      </main>
    );
  }

  if (error && !session) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="font-bold text-red-900">
              Calendar unavailable
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              onClick={loadCalendar}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <section>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 text-sm font-medium text-emerald-600">
                Administration / Calendar
              </div>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Academic Calendar
              </h1>

              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                Manage school events, examinations, holidays and
                important academic dates.
              </p>
            </div>

            <button
              onClick={openCreate}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              + Add Event
            </button>
          </div>
        </section>

        {/* Alerts */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Session */}
        {session && (
          <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Current Academic Session
            </p>

            <h2 className="mt-2 text-xl font-bold">
              {session.name}
            </h2>
          </section>
        )}

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Events
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {events.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Published
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {publishedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Upcoming
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {upcomingCount}
            </p>
          </div>
        </section>

        {/* Calendar */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {monthLabel}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                School events and academic activities
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setSelectedMonth(new Date())
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Today
              </button>

              <button
                onClick={() => changeMonth(-1)}
                className="h-9 w-9 rounded-lg border border-slate-200 text-lg text-slate-600 hover:bg-slate-50"
              >
                ‹
              </button>

              <button
                onClick={() => changeMonth(1)}
                className="h-9 w-9 rounded-lg border border-slate-200 text-lg text-slate-600 hover:bg-slate-50"
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
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
                className="py-3 text-center text-[11px] font-bold uppercase text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-[100px] border-b border-r border-slate-100 bg-slate-50/50 sm:min-h-[130px]"
                  />
                );
              }

              const dayEvents = eventsForDay(date);

              const today = new Date();

              const isToday =
                date.toDateString() ===
                today.toDateString();

              return (
                <div
                  key={date.toISOString()}
                  className="min-h-[100px] border-b border-r border-slate-100 p-1.5 hover:bg-slate-50 sm:min-h-[130px] sm:p-2"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600"
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => openEdit(event)}
                        className={`block w-full truncate rounded-md px-1.5 py-1 text-left text-[9px] font-semibold sm:text-[10px] ${getEventBadge(
                          event.event_type
                        )}`}
                        title={event.title}
                      >
                        {event.title}
                      </button>
                    ))}

                    {dayEvents.length > 3 && (
                      <p className="text-[9px] font-semibold text-slate-400">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Events list */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Manage Events
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage important academic dates.
            </p>

            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
              />

              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value)
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
              >
                <option value="all">All Types</option>

                {eventTypes.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredEvents.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl">📅</div>

                <h3 className="mt-3 font-semibold text-slate-800">
                  No events found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Create your first academic event.
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">
                        {event.title}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getEventBadge(
                          event.event_type
                        )}`}
                      >
                        {formatEventType(
                          event.event_type
                        )}
                      </span>

                      {!event.is_published && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                          Draft
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {formatDate(event.start_date)}

                      {event.end_date &&
                        ` → ${formatDate(event.end_date)}`}
                    </p>

                    {event.location && (
                      <p className="mt-1 text-xs text-slate-400">
                        📍 {event.location}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        togglePublished(event)
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      {event.is_published
                        ? "Unpublish"
                        : "Publish"}
                    </button>

                    <button
                      onClick={() => openEdit(event)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteEvent(event)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Event modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingEvent
                      ? "Edit Academic Event"
                      : "Add Academic Event"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Add an important date to the school calendar.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-slate-100"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5 p-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Event Title
                  </label>

                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. First Term Examination"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Event Type
                    </label>

                    <select
                      value={form.event_type}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          event_type: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    >
                      {eventTypes.map((type) => (
                        <option
                          key={type.value}
                          value={type.value}
                        >
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Term
                    </label>

                    <select
                      value={form.term_id}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          term_id: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="">
                        Entire Session
                      </option>

                      {terms.map((term) => (
                        <option
                          key={term.id}
                          value={term.id}
                        >
                          {term.name.charAt(0).toUpperCase() +
                            term.name.slice(1)}{" "}
                          Term
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Start Date
                    </label>

                    <input
                      required
                      type="date"
                      value={form.start_date}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          start_date: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      End Date
                    </label>

                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          end_date: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={form.is_all_day}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        is_all_day: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      All-day event
                    </p>

                    <p className="text-xs text-slate-500">
                      No specific start or end time.
                    </p>
                  </div>
                </label>

                {!form.is_all_day && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Start Time
                      </label>

                      <input
                        type="time"
                        value={form.start_time}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            start_time: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        End Time
                      </label>

                      <input
                        type="time"
                        value={form.end_time}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            end_time: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Location
                  </label>

                  <input
                    value={form.location}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        location: e.target.value,
                      })
                    }
                    placeholder="e.g. School Hall"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    placeholder="Additional information..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        is_published: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Publish event
                    </p>

                    <p className="text-xs text-slate-500">
                      Published events will be visible to staff and
                      students.
                    </p>
                  </div>
                </label>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingEvent
                        ? "Save Changes"
                        : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
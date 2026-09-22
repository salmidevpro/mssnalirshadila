"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Eye,
  GraduationCap,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  UserRoundX,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type StudentStatus =
  | "active"
  | "inactive"
  | "graduated"
  | "suspended";

type Student = {
  id: string;
  user_id: string;
  student_id: string;
  class_id: string | null;
  admission_number: string | null;
  admission_date: string | null;
  date_of_birth: string | null;
  status: StudentStatus;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  state: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  profile_photo: string | null;
  lga: string | null;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  email: string | null;
  phone: string | null;
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

type Enrollment = {
  id: string;
  student_id: string;
  session_id: string;
  class_id: string;
  enrollment_date: string;
  status: string;
};

type StudentForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  studentId: string;
  admissionNumber: string;
  classId: string;
  admissionDate: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  state: string;
  lga: string;
};

const initialForm: StudentForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  studentId: "",
  admissionNumber: "",
  classId: "",
  admissionDate: "",
  dateOfBirth: "",
  guardianName: "",
  guardianPhone: "",
  address: "",
  state: "",
  lga: "",
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getFullName(
  student: Student,
  profile?: Profile
) {
  if (student.full_name?.trim()) {
    return student.full_name;
  }

  return [
    profile?.first_name,
    profile?.middle_name,
    profile?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || "Unnamed student";
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "ST"
  );
}

function statusClasses(status: StudentStatus) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "inactive":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "graduated":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "suspended":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function Modal({
  children,
  onClose,
  title,
  description,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  description?: string;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-xs text-slate-500">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

export default function StudentsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [students, setStudents] = useState<Student[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [levels, setLevels] = useState<EducationLevel[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    StudentStatus | "all"
  >("all");
  const [classFilter, setClassFilter] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [form, setForm] = useState<StudentForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadStudents = useCallback(
    async (isRefresh = false) => {
      try {
        setError("");

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [
          studentsResponse,
          profilesResponse,
          classesResponse,
          levelsResponse,
          sessionsResponse,
          termsResponse,
          enrollmentsResponse,
        ] = await Promise.all([
          supabase
            .from("students")
            .select(
              "id,user_id,student_id,class_id,admission_number,admission_date,date_of_birth,status,full_name,phone,address,state,guardian_name,guardian_phone,profile_photo,lga"
            )
            .order("created_at", { ascending: false }),

          supabase
            .from("profiles")
            .select(
              "id,first_name,last_name,middle_name,email,phone"
            ),

          supabase
            .from("classes")
            .select("id,name,education_level_id")
            .order("name"),

          supabase
            .from("education_levels")
            .select("id,name")
            .order("name"),

          supabase
            .from("academic_sessions")
            .select("id,name,is_current")
            .order("start_date", { ascending: false }),

          supabase
            .from("academic_terms")
            .select("id,session_id,name,is_current")
            .order("created_at", { ascending: false }),

          supabase
            .from("student_enrollments")
            .select(
              "id,student_id,session_id,class_id,enrollment_date,status"
            ),
        ]);

        const responseError =
          studentsResponse.error ||
          profilesResponse.error ||
          classesResponse.error ||
          levelsResponse.error ||
          sessionsResponse.error ||
          termsResponse.error ||
          enrollmentsResponse.error;

        if (responseError) {
          throw new Error(responseError.message);
        }

        setStudents((studentsResponse.data ?? []) as Student[]);
        setProfiles((profilesResponse.data ?? []) as Profile[]);
        setClasses((classesResponse.data ?? []) as ClassRow[]);
        setLevels(
          (levelsResponse.data ?? []) as EducationLevel[]
        );
        setSessions(
          (sessionsResponse.data ?? []) as Session[]
        );
        setTerms((termsResponse.data ?? []) as Term[]);
        setEnrollments(
          (enrollmentsResponse.data ?? []) as Enrollment[]
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load students."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStudents();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadStudents]);

  const profileMap = useMemo(() => {
    return new Map(
      profiles.map((profile) => [profile.id, profile])
    );
  }, [profiles]);

  const classMap = useMemo(() => {
    return new Map(
      classes.map((classItem) => [classItem.id, classItem])
    );
  }, [classes]);

  const levelMap = useMemo(() => {
    return new Map(
      levels.map((level) => [level.id, level])
    );
  }, [levels]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const profile = profileMap.get(student.user_id);
      const fullName = getFullName(student, profile);

      const matchesSearch =
        !query ||
        fullName.toLowerCase().includes(query) ||
        student.student_id.toLowerCase().includes(query) ||
        student.admission_number
          ?.toLowerCase()
          .includes(query) ||
        profile?.email?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        student.status === statusFilter;

      const matchesClass =
        classFilter === "all" ||
        student.class_id === classFilter;

      return (
        Boolean(matchesSearch) &&
        matchesStatus &&
        matchesClass
      );
    });
  }, [
    students,
    profileMap,
    search,
    statusFilter,
    classFilter,
  ]);

  const stats = useMemo(
    () => ({
      total: students.length,
      active: students.filter(
        (student) => student.status === "active"
      ).length,
      inactive: students.filter(
        (student) => student.status === "inactive"
      ).length,
      graduated: students.filter(
        (student) => student.status === "graduated"
      ).length,
      suspended: students.filter(
        (student) => student.status === "suspended"
      ).length,
    }),
    [students]
  );

  const currentSession = useMemo(
    () =>
      sessions.find((session) => session.is_current) ??
      sessions[0] ??
      null,
    [sessions]
  );

  const currentTerm = useMemo(
    () =>
      terms.find(
        (term) =>
          term.is_current &&
          term.session_id === currentSession?.id
      ) ??
      terms.find(
        (term) =>
          term.session_id === currentSession?.id
      ) ??
      null,
    [terms, currentSession]
  );

  function updateForm<K extends keyof StudentForm>(
    key: K,
    value: StudentForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function openAddModal() {
    setForm({
      ...initialForm,
      admissionDate: new Date()
        .toISOString()
        .slice(0, 10),
    });

    setActionError("");
    setShowAddModal(true);
  }

  function openDetails(student: Student) {
    setSelectedStudent(student);
    setActionError("");
    setShowDetailsModal(true);
  }

  function openEdit(student: Student) {
    const profile = profileMap.get(student.user_id);

    setSelectedStudent(student);

    setForm({
      firstName: profile?.first_name ?? "",
      middleName: profile?.middle_name ?? "",
      lastName: profile?.last_name ?? "",
      email: profile?.email ?? "",
      phone: student.phone ?? profile?.phone ?? "",
      studentId: student.student_id,
      admissionNumber: student.admission_number ?? "",
      classId: student.class_id ?? "",
      admissionDate: student.admission_date ?? "",
      dateOfBirth: student.date_of_birth ?? "",
      guardianName: student.guardian_name ?? "",
      guardianPhone: student.guardian_phone ?? "",
      address: student.address ?? "",
      state: student.state ?? "",
      lga: student.lga ?? "",
    });

    setActionError("");
    setShowEditModal(true);
  }

  function openDelete(student: Student) {
    setSelectedStudent(student);
    setActionError("");
    setShowDeleteModal(true);
  }

async function handleAddStudent(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  try {
    setSaving(true);
    setActionError("");

    const firstName = form.firstName.trim();
    const middleName = form.middleName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();
    const studentId = form.studentId.trim();
    const classId = form.classId.trim();

    if (!firstName) {
      throw new Error("First name is required.");
    }

    if (!lastName) {
      throw new Error("Surname is required.");
    }

    if (!studentId) {
      throw new Error("Student ID is required.");
    }

    if (!classId) {
      throw new Error("Please select a class.");
    }

    if (!email) {
      throw new Error("Email is required.");
    }

    /*
     * The server will:
     *
     * 1. Normalize the student's name.
     * 2. Use the surname as the temporary password.
     * 3. Create the Supabase Auth account.
     * 4. Create the profile.
     * 5. Create the student record.
     * 6. Create the current-session enrollment.
     *
     * The password is NEVER created from the browser.
     */
    const response = await fetch("/api/admin/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        middleName,
        lastName,
        email,
        phone: form.phone.trim(),
        studentId,
        admissionNumber: form.admissionNumber.trim(),
        classId,
        admissionDate: form.admissionDate || null,
        dateOfBirth: form.dateOfBirth || null,
        guardianName: form.guardianName.trim(),
        guardianPhone: form.guardianPhone.trim(),
        address: form.address.trim(),
        state: form.state.trim(),
        lga: form.lga.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error || "Unable to create student."
      );
    }

    /*
     * The API returns the temporary password once.
     * We show it to the admin so it can be given to the student.
     */
    const temporaryPassword =
      result?.temporaryPassword;

    setShowAddModal(false);
    setForm(initialForm);

    await loadStudents(true);

    if (temporaryPassword) {
      window.alert(
        `Student created successfully.\n\nTemporary password: ${temporaryPassword}\n\nGive this password to the student. They should change it after their first login.`
      );
    }
  } catch (err) {
    console.error(err);

    setActionError(
      err instanceof Error
        ? err.message
        : "Unable to create student."
    );
  } finally {
    setSaving(false);
  }
}

  async function handleUpdateStudent(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedStudent) return;

    try {
      setSaving(true);
      setActionError("");

      const fullName = [
        form.firstName,
        form.middleName,
        form.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: form.firstName.trim(),
          middle_name: form.middleName.trim() || null,
          last_name: form.lastName.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
        })
        .eq("id", selectedStudent.user_id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      const { error: studentError } = await supabase
        .from("students")
        .update({
          student_id: form.studentId.trim(),
          class_id: form.classId || null,
          admission_number:
            form.admissionNumber.trim() || null,
          admission_date:
            form.admissionDate || null,
          date_of_birth:
            form.dateOfBirth || null,
          full_name: fullName || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          state: form.state.trim() || null,
          guardian_name:
            form.guardianName.trim() || null,
          guardian_phone:
            form.guardianPhone.trim() || null,
          lga: form.lga.trim() || null,
        })
        .eq("id", selectedStudent.id);

      if (studentError) {
        throw new Error(studentError.message);
      }

      if (currentSession && form.classId) {
        const existingEnrollment = enrollments.find(
          (enrollment) =>
            enrollment.student_id === selectedStudent.id &&
            enrollment.session_id === currentSession.id
        );

        if (existingEnrollment) {
          await supabase
            .from("student_enrollments")
            .update({
              class_id: form.classId,
            })
            .eq("id", existingEnrollment.id);
        } else {
          await supabase
            .from("student_enrollments")
            .insert({
              student_id: selectedStudent.id,
              session_id: currentSession.id,
              class_id: form.classId,
              enrollment_date:
                form.admissionDate ||
                new Date().toISOString().slice(0, 10),
              status: "active",
            });
        }
      }

      setShowEditModal(false);
      setSelectedStudent(null);

      await loadStudents(true);
    } catch (err) {
      console.error(err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to update student."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(
    student: Student,
    status: StudentStatus
  ) {
    try {
      setActionError("");

      const { error } = await supabase
        .from("students")
        .update({ status })
        .eq("id", student.id);

      if (error) {
        throw new Error(error.message);
      }

      await loadStudents(true);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to update student status."
      );
    }
  }

  async function handleDeleteStudent() {
    if (!selectedStudent) return;

    try {
      setSaving(true);
      setActionError("");

      /*
       * We archive by marking inactive rather than physically
       * deleting the record. This preserves academic history,
       * results, attendance and financial references.
       */
      const { error } = await supabase
        .from("students")
        .update({
          status: "inactive",
        })
        .eq("id", selectedStudent.id);

      if (error) {
        throw new Error(error.message);
      }

      setShowDeleteModal(false);
      setSelectedStudent(null);

      await loadStudents(true);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to archive student."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading students...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Reading student records from the database
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert
            size={32}
            className="mx-auto text-red-600"
          />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Unable to load students
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => loadStudents(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
        {/* HEADER */}
        <section>
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <Users size={14} />
                Student Management
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Students
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage student records, enrollment, class placement,
                guardians and academic status from one workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={refreshing}
                onClick={() => loadStudents(true)}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing ? "animate-spin" : ""
                  }
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                <Plus size={17} />
                Add student
              </button>
            </div>
          </div>
        </section>

        {/* STATISTICS */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total
              </p>

              <Users size={19} className="text-blue-600" />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {stats.total}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              All student records
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Active
              </p>

              <CheckCircle2
                size={19}
                className="text-emerald-600"
              />
            </div>

            <p className="mt-3 text-3xl font-bold text-emerald-950">
              {stats.active}
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              Currently enrolled
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Inactive
              </p>

              <UserRoundX
                size={19}
                className="text-slate-500"
              />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {stats.inactive}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Inactive records
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Graduated
              </p>

              <GraduationCap
                size={19}
                className="text-blue-600"
              />
            </div>

            <p className="mt-3 text-3xl font-bold text-blue-950">
              {stats.graduated}
            </p>

            <p className="mt-1 text-xs text-blue-700">
              Completed students
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Suspended
              </p>

              <ShieldAlert
                size={19}
                className="text-red-600"
              />
            </div>

            <p className="mt-3 text-3xl font-bold text-red-950">
              {stats.suspended}
            </p>

            <p className="mt-1 text-xs text-red-700">
              Requires attention
            </p>
          </div>
        </section>

        {/* TOOLBAR */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, student ID, admission number or email..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | StudentStatus
                    | "all"
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium capitalize text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={classFilter}
              onChange={(event) =>
                setClassFilter(event.target.value)
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All classes</option>

              {classes.map((classItem) => (
                <option
                  key={classItem.id}
                  value={classItem.id}
                >
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <strong className="text-slate-800">
                {filteredStudents.length}
              </strong>{" "}
              of{" "}
              <strong className="text-slate-800">
                {students.length}
              </strong>{" "}
              students
            </p>

            {(search ||
              statusFilter !== "all" ||
              classFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setClassFilter("all");
                }}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        {/* TABLE */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-slate-900">
                Student directory
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Live records from the student database.
              </p>
            </div>

            <div className="text-xs text-slate-400">
              {currentSession?.name ?? "No current session"}
              {currentTerm
                ? ` · ${currentTerm.name} term`
                : ""}
            </div>
          </div>

          {filteredStudents.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3 font-semibold">
                      Student
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Student ID
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Class
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Admission
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const profile = profileMap.get(
                      student.user_id
                    );

                    const fullName = getFullName(
                      student,
                      profile
                    );

                    const classItem = student.class_id
                      ? classMap.get(student.class_id)
                      : undefined;

                    return (
                      <tr
                        key={student.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {student.profile_photo ? (
                              <Image
                                src={student.profile_photo}
                                alt={fullName}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                                {getInitials(fullName)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-800">
                                {fullName}
                              </p>

                              <p className="truncate text-xs text-slate-400">
                                {profile?.email ||
                                  student.phone ||
                                  "No contact information"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-mono text-sm font-semibold text-slate-700">
                            {student.student_id}
                          </span>

                          {student.admission_number && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Adm: {student.admission_number}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-700">
                            {classItem?.name ?? "Not assigned"}
                          </p>

                          {classItem?.education_level_id && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              {
                                levelMap.get(
                                  classItem.education_level_id
                                )?.name
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(
                            student.admission_date
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusClasses(
                              student.status
                            )}`}
                          >
                            {student.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              title="View student"
                              onClick={() =>
                                openDetails(student)
                              }
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              title="Edit student"
                              onClick={() =>
                                openEdit(student)
                              }
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              title="Archive student"
                              onClick={() =>
                                openDelete(student)
                              }
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-700"
                            >
                              <Archive size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-16">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Users size={25} />
                </div>

                <h3 className="mt-4 font-bold text-slate-800">
                  No students found
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {students.length
                    ? "Try changing your search or filters."
                    : "There are currently no student records in the database."}
                </p>

                {!students.length && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <UserPlus size={16} />
                    Add first student
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ADD STUDENT */}
      {showAddModal && (
        <Modal
          title="Add student"
          description="Create a new student record and place the student in a class."
          onClose={() => !saving && setShowAddModal(false)}
        >
          <form
            onSubmit={handleAddStudent}
            className="space-y-6"
          >
            {actionError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                Personal information
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormInput
                  label="First name"
                  value={form.firstName}
                  onChange={(value) =>
                    updateForm("firstName", value)
                  }
                  required
                />

                <FormInput
                  label="Middle name"
                  value={form.middleName}
                  onChange={(value) =>
                    updateForm("middleName", value)
                  }
                />

                <FormInput
                  label="Last name"
                  value={form.lastName}
                  onChange={(value) =>
                    updateForm("lastName", value)
                  }
                  required
                />

                <FormInput
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    updateForm("email", value)
                  }
                  required
                />

                <FormInput
                  label="Phone"
                  value={form.phone}
                  onChange={(value) =>
                    updateForm("phone", value)
                  }
                />

                <FormInput
                  label="Date of birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(value) =>
                    updateForm("dateOfBirth", value)
                  }
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                Academic information
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Student ID"
                  value={form.studentId}
                  onChange={(value) =>
                    updateForm("studentId", value)
                  }
                  placeholder="e.g. MSSN/2026/001"
                  required
                />

                <FormInput
                  label="Admission number"
                  value={form.admissionNumber}
                  onChange={(value) =>
                    updateForm("admissionNumber", value)
                  }
                />

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Class <span className="text-red-500">*</span>
                  </span>

                  <select
                    required
                    value={form.classId}
                    onChange={(event) =>
                      updateForm(
                        "classId",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select class</option>

                    {classes.map((classItem) => (
                      <option
                        key={classItem.id}
                        value={classItem.id}
                      >
                        {classItem.name}
                      </option>
                    ))}
                  </select>
                </label>

                <FormInput
                  label="Admission date"
                  type="date"
                  value={form.admissionDate}
                  onChange={(value) =>
                    updateForm("admissionDate", value)
                  }
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                Guardian information
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Guardian name"
                  value={form.guardianName}
                  onChange={(value) =>
                    updateForm("guardianName", value)
                  }
                />

                <FormInput
                  label="Guardian phone"
                  value={form.guardianPhone}
                  onChange={(value) =>
                    updateForm("guardianPhone", value)
                  }
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                Address
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <FormInput
                    label="Address"
                    value={form.address}
                    onChange={(value) =>
                      updateForm("address", value)
                    }
                  />
                </div>

                <FormInput
                  label="State"
                  value={form.state}
                  onChange={(value) =>
                    updateForm("state", value)
                  }
                />

                <FormInput
                  label="LGA"
                  value={form.lga}
                  onChange={(value) =>
                    updateForm("lga", value)
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {saving && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                {saving ? "Creating..." : "Create student"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DETAILS */}
      {showDetailsModal && selectedStudent && (
        <Modal
          title="Student profile"
          description="Student information and current academic placement."
          onClose={() => setShowDetailsModal(false)}
        >
          {(() => {
            const profile = profileMap.get(
              selectedStudent.user_id
            );

            const fullName = getFullName(
              selectedStudent,
              profile
            );

            const classItem = selectedStudent.class_id
              ? classMap.get(selectedStudent.class_id)
              : null;

            const level = classItem?.education_level_id
              ? levelMap.get(
                  classItem.education_level_id
                )
              : null;

            return (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">
                  {selectedStudent.profile_photo ? (
                    <img
                      src={selectedStudent.profile_photo}
                      alt={fullName}
                      className="h-20 w-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                      {getInitials(fullName)}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">
                        {fullName}
                      </h3>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusClasses(
                          selectedStudent.status
                        )}`}
                      >
                        {selectedStudent.status}
                      </span>
                    </div>

                    <p className="mt-1 font-mono text-sm text-slate-500">
                      {selectedStudent.student_id}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailsModal(false);
                      openEdit(selectedStudent);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    <Edit3 size={15} />
                    Edit
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Class
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {classItem?.name ?? "Not assigned"}
                    </p>

                    {level && (
                      <p className="mt-1 text-xs text-slate-500">
                        {level.name}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Admission
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {formatDate(
                        selectedStudent.admission_date
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Date of birth
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {formatDate(
                        selectedStudent.date_of_birth
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Email
                    </p>

                    <p className="mt-2 break-all font-semibold text-slate-800">
                      {profile?.email ?? "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Phone
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {selectedStudent.phone ??
                        profile?.phone ??
                        "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Admission number
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {selectedStudent.admission_number ??
                        "—"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="font-bold text-slate-900">
                    Guardian
                  </h3>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-400">
                        Name
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {selectedStudent.guardian_name ??
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Phone
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {selectedStudent.guardian_phone ??
                          "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="font-bold text-slate-900">
                    Address
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {[
                      selectedStudent.address,
                      selectedStudent.lga,
                      selectedStudent.state,
                    ]
                      .filter(Boolean)
                      .join(", ") || "No address recorded."}
                  </p>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* EDIT */}
      {showEditModal && selectedStudent && (
        <Modal
          title="Edit student"
          description="Update the student's personal, academic and guardian information."
          onClose={() => !saving && setShowEditModal(false)}
        >
          <form
            onSubmit={handleUpdateStudent}
            className="space-y-6"
          >
            {actionError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <FormInput
                label="First name"
                value={form.firstName}
                onChange={(value) =>
                  updateForm("firstName", value)
                }
                required
              />

              <FormInput
                label="Middle name"
                value={form.middleName}
                onChange={(value) =>
                  updateForm("middleName", value)
                }
              />

              <FormInput
                label="Last name"
                value={form.lastName}
                onChange={(value) =>
                  updateForm("lastName", value)
                }
                required
              />

              <FormInput
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  updateForm("email", value)
                }
              />

              <FormInput
                label="Phone"
                value={form.phone}
                onChange={(value) =>
                  updateForm("phone", value)
                }
              />

              <FormInput
                label="Student ID"
                value={form.studentId}
                onChange={(value) =>
                  updateForm("studentId", value)
                }
                required
              />

              <FormInput
                label="Admission number"
                value={form.admissionNumber}
                onChange={(value) =>
                  updateForm(
                    "admissionNumber",
                    value
                  )
                }
              />

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Class
                </span>

                <select
                  value={form.classId}
                  onChange={(event) =>
                    updateForm(
                      "classId",
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Not assigned</option>

                  {classes.map((classItem) => (
                    <option
                      key={classItem.id}
                      value={classItem.id}
                    >
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </label>

              <FormInput
                label="Admission date"
                type="date"
                value={form.admissionDate}
                onChange={(value) =>
                  updateForm("admissionDate", value)
                }
              />

              <FormInput
                label="Date of birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(value) =>
                  updateForm("dateOfBirth", value)
                }
              />

              <FormInput
                label="Guardian name"
                value={form.guardianName}
                onChange={(value) =>
                  updateForm("guardianName", value)
                }
              />

              <FormInput
                label="Guardian phone"
                value={form.guardianPhone}
                onChange={(value) =>
                  updateForm("guardianPhone", value)
                }
              />

              <div className="sm:col-span-3">
                <FormInput
                  label="Address"
                  value={form.address}
                  onChange={(value) =>
                    updateForm("address", value)
                  }
                />
              </div>

              <FormInput
                label="State"
                value={form.state}
                onChange={(value) =>
                  updateForm("state", value)
                }
              />

              <FormInput
                label="LGA"
                value={form.lga}
                onChange={(value) =>
                  updateForm("lga", value)
                }
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowEditModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {saving && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ARCHIVE */}
      {showDeleteModal && selectedStudent && (
        <Modal
          title="Archive student"
          description="The student will be marked inactive instead of permanently deleted."
          onClose={() => !saving && setShowDeleteModal(false)}
        >
          {(() => {
            const profile = profileMap.get(
              selectedStudent.user_id
            );

            const fullName = getFullName(
              selectedStudent,
              profile
            );

            return (
              <div>
                {actionError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {actionError}
                  </div>
                )}

                <div className="rounded-xl bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <Archive
                      size={20}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />

                    <div>
                      <p className="font-semibold text-amber-900">
                        Archive {fullName}?
                      </p>

                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        This will change the student&apos;s status to
                        inactive. Their results, attendance,
                        enrollment and other historical records
                        will remain available.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      setShowDeleteModal(false)
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleDeleteStudent}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {saving && (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    {saving
                      ? "Archiving..."
                      : "Archive student"}
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </>
  );
}
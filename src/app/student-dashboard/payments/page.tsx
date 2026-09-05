"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Receipt,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

/* =====================================================
   TYPES
===================================================== */

type Student = {
  id: string;
  full_name: string | null;
  admission_number: string | null;
  profile_photo: string | null;
};

type Enrollment = {
  id: string;
  student_id: string;
  session_id: string;
  class_id: string;
  enrollment_date: string | null;
  status: string | null;
};

type SchoolClass = {
  id: string;
  name: string;
};

type AcademicSession = {
  id: string;
  name: string;
};

type AcademicTerm = {
  id: string;
  session_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
};

type BillItem = {
  id: string;
  bill_id: string;
  fee_structure_id: string | null;
  fee_name: string;
  amount: number;
  amount_paid: number;
};

type Bill = {
  id: string;
  student_id: string;
  session_id: string;
  term_id: string;
  status: string | null;
  student_bill_items: BillItem[];
};

type Payment = {
  id: string;
  student_id: string;
  bill_id: string;
  session_id: string;
  term_id: string;
  amount: number;
  reference: string | null;
  payment_method: string | null;
  status: string | null;
  paid_at: string | null;
  created_at: string;
};

type PaymentPageData = {
  student: Student;
  enrollment: Enrollment;
  schoolClass: SchoolClass;
  academicSession: AcademicSession;
  term: AcademicTerm;
  bill: Bill | null;
  payments: Payment[];
};

/* =====================================================
   HELPERS
===================================================== */

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function getPaymentStatus(status: string | null) {
  const normalized = status?.toLowerCase();

  if (
    normalized === "success" ||
    normalized === "successful" ||
    normalized === "completed" ||
    normalized === "paid"
  ) {
    return "successful";
  }

  if (
    normalized === "pending" ||
    normalized === "processing"
  ) {
    return "pending";
  }

  return "failed";
}

/* =====================================================
   PAGE
===================================================== */

export default function StudentPaymentsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [data, setData] =
    useState<PaymentPageData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] =
    useState(true);

  /* ===================================================
     LOAD PAYMENT DATA
  ================================================== */

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsAuthenticated(true);

      /* =================================================
         AUTHENTICATION
      ================================================== */

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        setIsAuthenticated(false);

        setError(
          "You are not signed in. Please sign in to access your payment information.",
        );

        return;
      }

      const userId = authData.user.id;

      /* =================================================
         STUDENT
      ================================================== */

      const {
        data: studentData,
        error: studentError,
      } = await supabase
        .from("students")
        .select(
          `
            id,
            full_name,
            admission_number,
            profile_photo
          `,
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (studentError) {
        console.error(
          "Student lookup error:",
          studentError,
        );

        setError(
          "Unable to load your student account. Please try again.",
        );

        return;
      }

      if (!studentData) {
        setError(
          "Your student account could not be found. Please contact the school administrator.",
        );

        return;
      }

      const student =
        studentData as Student;

      /* =================================================
         CURRENT ENROLLMENT
      ================================================== */

      const {
        data: enrollmentData,
        error: enrollmentError,
      } = await supabase
        .from("student_enrollments")
        .select(
          `
            id,
            student_id,
            session_id,
            class_id,
            enrollment_date,
            status
          `,
        )
        .eq("student_id", student.id)
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (enrollmentError) {
        console.error(
          "Enrollment lookup error:",
          enrollmentError,
        );

        setError(
          "Unable to load your current school enrollment. Please try again.",
        );

        return;
      }

      if (!enrollmentData) {
        setError(
          "Your current school enrollment could not be found. Please contact the school administrator.",
        );

        return;
      }

      const enrollment =
        enrollmentData as Enrollment;

      /* =================================================
         CLASS
         
         IMPORTANT:
         We fetch the class separately instead of relying
         on Supabase nested relationship data.
      ================================================== */

      if (!enrollment.class_id) {
        setError(
          "Your current class could not be found. Please contact the school administrator.",
        );

        return;
      }

      const {
        data: classData,
        error: classError,
      } = await supabase
        .from("classes")
        .select(
          `
            id,
            name
          `,
        )
        .eq("id", enrollment.class_id)
        .maybeSingle();

      if (classError) {
        console.error(
          "Class lookup error:",
          classError,
        );

        setError(
          "Unable to load your current class. Please try again.",
        );

        return;
      }

      if (!classData) {
        console.error(
          "Class not found for class_id:",
          enrollment.class_id,
        );

        setError(
          "Your current class could not be found. Please contact the school administrator.",
        );

        return;
      }

      const schoolClass =
        classData as SchoolClass;

      /* =================================================
         ACADEMIC SESSION
         
         Again, fetch separately using session_id.
      ================================================== */

      if (!enrollment.session_id) {
        setError(
          "Your academic session could not be determined. Please contact the school administrator.",
        );

        return;
      }

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase
        .from("academic_sessions")
        .select(
          `
            id,
            name
          `,
        )
        .eq("id", enrollment.session_id)
        .maybeSingle();

      if (sessionError) {
        console.error(
          "Academic session lookup error:",
          sessionError,
        );

        setError(
          "Unable to load your academic session. Please try again.",
        );

        return;
      }

      if (!sessionData) {
        setError(
          "Your academic session could not be found. Please contact the school administrator.",
        );

        return;
      }

      const academicSession =
        sessionData as AcademicSession;

      /* =================================================
         CURRENT TERM
      ================================================== */

      const {
        data: termData,
        error: termError,
      } = await supabase
        .from("academic_terms")
        .select(
          `
            id,
            session_id,
            name,
            start_date,
            end_date,
            is_current
          `,
        )
        .eq("session_id", enrollment.session_id)
        .eq("is_current", true)
        .maybeSingle();

      if (termError) {
        console.error(
          "Academic term lookup error:",
          termError,
        );

        setError(
          "Unable to load the current academic term. Please try again.",
        );

        return;
      }

      if (!termData) {
        setError(
          "The current academic term could not be found. Please contact the school administrator.",
        );

        return;
      }

      const term =
        termData as AcademicTerm;

      /* =================================================
         STUDENT BILL
      ================================================== */

      const {
        data: billData,
        error: billError,
      } = await supabase
        .from("student_bills")
        .select(
          `
            id,
            student_id,
            session_id,
            term_id,
            status,
            student_bill_items (
              id,
              bill_id,
              fee_structure_id,
              fee_name,
              amount,
              amount_paid
            )
          `,
        )
        .eq("student_id", student.id)
        .eq("session_id", enrollment.session_id)
        .eq("term_id", term.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (billError) {
        console.error(
          "Student bill lookup error:",
          billError,
        );

        setError(
          "Unable to load your school bill. Please try again.",
        );

        return;
      }

      let bill: Bill | null = null;

      if (billData) {
        const rawBill =
          billData as Bill & {
            student_bill_items:
              | BillItem[]
              | null;
          };

        bill = {
          ...rawBill,
          student_bill_items:
            rawBill.student_bill_items ?? [],
        };
      }

      /* =================================================
         PAYMENT HISTORY
      ================================================== */

      let payments: Payment[] = [];

      if (bill) {
        const {
          data: paymentData,
          error: paymentError,
        } = await supabase
          .from("payments")
          .select(
            `
              id,
              student_id,
              bill_id,
              session_id,
              term_id,
              amount,
              reference,
              payment_method,
              status,
              paid_at,
              created_at
            `,
          )
          .eq("student_id", student.id)
          .eq("bill_id", bill.id)
          .order("created_at", {
            ascending: false,
          });

        if (paymentError) {
          console.error(
            "Payment history error:",
            paymentError,
          );

          setError(
            "Unable to load your payment history. Please try again.",
          );

          return;
        }

        payments =
          (paymentData as Payment[]) ?? [];
      }

      /* =================================================
         FINAL DATA
      ================================================== */

      setData({
        student,
        enrollment,
        schoolClass,
        academicSession,
        term,
        bill,
        payments,
      });
    } catch (err) {
      console.error(
        "Payments page error:",
        err,
      );

      setError(
        "Something went wrong while loading your payment information. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /* =====================================================
     INITIAL LOAD
  ====================================================== */

  useEffect(() => {
    const frame =
      globalThis.requestAnimationFrame(() => {
        void loadPayments();
      });

    return () => {
      globalThis.cancelAnimationFrame(frame);
    };
  }, [loadPayments]);

  /* =====================================================
     LOADING STATE
  ====================================================== */

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <section className="border-b border-slate-200 bg-white px-5 py-8 sm:px-8">
          <div className="animate-pulse">
            <div className="h-3 w-20 rounded bg-slate-200" />

            <div className="mt-4 h-9 w-56 rounded bg-slate-200" />

            <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100" />
          </div>
        </section>

        <main className="px-5 py-8 sm:px-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="h-52 animate-pulse rounded-3xl bg-white" />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-32 animate-pulse rounded-3xl bg-white" />
              <div className="h-32 animate-pulse rounded-3xl bg-white" />
              <div className="h-32 animate-pulse rounded-3xl bg-white" />
            </div>

            <div className="h-96 animate-pulse rounded-3xl bg-white" />
          </div>
        </main>
      </div>
    );
  }

  /* =====================================================
     ERROR STATE
  ====================================================== */

  if (error || !data) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle size={25} />
          </div>

          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
            Payments Error
          </p>

          <h1
            className="mt-2 text-xl font-black"
            style={{
              color: SCHOOL_BLUE_DARK,
            }}
          >
            Unable to load payments
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error ??
              "Your payment information could not be loaded."}
          </p>

          {isAuthenticated === false && (
            <div className="mt-6">
              <Link
                href="/student-login"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                }}
              >
                Sign in here
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  const {
    student,
    schoolClass,
    academicSession,
    term,
    bill,
    payments,
  } = data;

  /* =====================================================
     BILL CALCULATIONS
  ====================================================== */

  const billItems =
    bill?.student_bill_items ?? [];

  const totalAmount =
    billItems.reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0,
    );

  const totalPaid =
    billItems.reduce(
      (total, item) =>
        total + Number(item.amount_paid || 0),
      0,
    );

  const outstanding = Math.max(
    totalAmount - totalPaid,
    0,
  );

  const paymentProgress =
    totalAmount > 0
      ? Math.min(
          (totalPaid / totalAmount) * 100,
          100,
        )
      : 0;

  const hasBill = Boolean(bill);
  const hasFees = billItems.length > 0;

  /* =====================================================
     UI
  ====================================================== */

  return (
    <div className="min-h-full bg-slate-50 text-slate-700">

      {/* =================================================
          HEADER
      ================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="px-5 py-7 sm:px-8 sm:py-9">

          <p
            className="text-[10px] font-black uppercase tracking-[0.22em]"
            style={{
              color: SCHOOL_GOLD,
            }}
          >
            Student Account
          </p>

          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <h1
                className="text-2xl font-black tracking-tight sm:text-3xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Payments
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                View your school fees, payment status and
                payment history.
              </p>
            </div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-slate-100">

                {student.profile_photo ? (
                  <img
                    src={student.profile_photo}
                    alt={
                      student.full_name ??
                      "Student"
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <WalletCards
                    size={19}
                    style={{
                      color: SCHOOL_BLUE,
                    }}
                  />
                )}

              </div>

              <div className="min-w-0">

                <p className="truncate text-xs font-black text-slate-700">
                  {student.full_name ??
                    "Student"}
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  {student.admission_number
                    ? `Admission No. ${student.admission_number}`
                    : "Student account"}
                </p>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =================================================
          MAIN
      ================================================== */}

      <main className="px-5 py-7 sm:px-8 sm:py-9">

        <div className="mx-auto max-w-6xl space-y-6">

          {/* =================================================
              ACADEMIC CONTEXT
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">

                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${SCHOOL_BLUE}08`,
                    color: SCHOOL_BLUE,
                  }}
                >
                  <FileText size={20} />
                </div>

                <div>

                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Current Academic Period
                  </p>

                  <h2
                    className="mt-1 text-base font-black"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    {schoolClass.name}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    {academicSession.name}{" "}
                    • {term.name}
                  </p>

                </div>

              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-600">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                Current Term

              </span>

            </div>

          </section>

          {/* =================================================
              SUMMARY
          ================================================== */}

          <section className="grid gap-4 sm:grid-cols-3">

            <SummaryCard
              icon={<Receipt size={19} />}
              label="Total Fees"
              value={formatCurrency(
                totalAmount,
              )}
              description={
                hasFees
                  ? `${billItems.length} fee item${
                      billItems.length === 1
                        ? ""
                        : "s"
                    }`
                  : "No fees assigned"
              }
            />

            <SummaryCard
              icon={<CheckCircle2 size={19} />}
              label="Amount Paid"
              value={formatCurrency(
                totalPaid,
              )}
              description={
                totalPaid > 0
                  ? "Payments received"
                  : "No payment recorded"
              }
              valueClassName="text-emerald-600"
            />

            <SummaryCard
              icon={<CreditCard size={19} />}
              label="Outstanding"
              value={formatCurrency(
                outstanding,
              )}
              description={
                outstanding > 0
                  ? "Amount remaining"
                  : totalAmount > 0
                    ? "Fees fully paid"
                    : "Nothing due yet"
              }
              valueClassName={
                outstanding > 0
                  ? "text-amber-600"
                  : "text-emerald-600"
              }
            />

          </section>

          {/* =================================================
              PAYMENT PROGRESS
          ================================================== */}

          {hasFees && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-7">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                <div>

                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Payment Progress
                  </p>

                  <h2
                    className="mt-1 text-base font-black"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    {paymentProgress.toFixed(
                      0,
                    )}
                    % paid
                  </h2>

                </div>

                <p className="text-xs text-slate-400">
                  {formatCurrency(
                    totalPaid,
                  )}{" "}
                  of{" "}
                  {formatCurrency(
                    totalAmount,
                  )}
                </p>

              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${paymentProgress}%`,
                    backgroundColor:
                      SCHOOL_BLUE,
                  }}
                />

              </div>

            </section>
          )}

          {/* =================================================
              NO FEES
          ================================================== */}

          {!hasBill || !hasFees ? (

            <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-12">

              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${SCHOOL_GOLD}15`,
                  color: SCHOOL_GOLD,
                }}
              >
                <WalletCards size={27} />
              </div>

              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Fees Not Published
              </p>

              <h2
                className="mt-2 text-xl font-black"
                style={{
                  color:
                    SCHOOL_BLUE_DARK,
                }}
              >
                No fees have been assigned yet
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                Your school has not published fees
                for your current class and academic
                term yet. Please check again later or
                contact the school administrator.
              </p>

              <Link
                href="/student-dashboard"
                className="mt-6 inline-flex items-center gap-2 text-xs font-black transition hover:opacity-70"
                style={{
                  color: SCHOOL_BLUE,
                }}
              >
                Back to dashboard
                <ArrowRight size={14} />
              </Link>

            </section>

          ) : (

            <>

              {/* =================================================
                  FEE BREAKDOWN
              ================================================== */}

              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(1,0,102,0.035)]">

                <div className="border-b border-slate-100 p-6 sm:p-7">

                  <div className="flex items-start gap-4">

                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${SCHOOL_BLUE}08`,
                        color: SCHOOL_BLUE,
                      }}
                    >
                      <Receipt size={19} />
                    </div>

                    <div>

                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Fee Breakdown
                      </p>

                      <h2
                        className="mt-1 text-base font-black"
                        style={{
                          color:
                            SCHOOL_BLUE_DARK,
                        }}
                      >
                        Your school fees
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        Fees assigned to your current
                        class and academic term.
                      </p>

                    </div>

                  </div>

                </div>

                <div className="divide-y divide-slate-100">

                  {billItems.map((item) => {

                    const amount =
                      Number(
                        item.amount || 0,
                      );

                    const paid =
                      Number(
                        item.amount_paid ||
                          0,
                      );

                    const balance =
                      Math.max(
                        amount - paid,
                        0,
                      );

                    return (
                      <div
                        key={item.id}
                        className="p-5 sm:p-6"
                      >

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                          <div className="flex min-w-0 items-start gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                              <FileText size={16} />
                            </div>

                            <div className="min-w-0">

                              <p className="text-sm font-black text-slate-700">
                                {item.fee_name}
                              </p>

                              <p className="mt-1 text-[10px] text-slate-400">
                                {balance <= 0
                                  ? "Fully paid"
                                  : `${formatCurrency(
                                      balance,
                                    )} remaining`}
                              </p>

                            </div>

                          </div>

                          <div className="sm:text-right">

                            <p className="text-sm font-black text-slate-800">
                              {formatCurrency(
                                amount,
                              )}
                            </p>

                            <p className="mt-1 text-[10px] text-emerald-600">
                              {formatCurrency(
                                paid,
                              )}{" "}
                              paid
                            </p>

                          </div>

                        </div>

                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">

                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${
                                amount > 0
                                  ? Math.min(
                                      (paid /
                                        amount) *
                                        100,
                                      100,
                                    )
                                  : 0
                              }%`,
                              backgroundColor:
                                SCHOOL_BLUE,
                            }}
                          />

                        </div>

                      </div>
                    );
                  })}

                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6">

                  <div className="flex items-center justify-between">

                    <p className="text-xs font-bold text-slate-500">
                      Total outstanding
                    </p>

                    <p
                      className="text-lg font-black"
                      style={{
                        color:
                          outstanding >
                          0
                            ? SCHOOL_BLUE_DARK
                            : "#059669",
                      }}
                    >
                      {formatCurrency(
                        outstanding,
                      )}
                    </p>

                  </div>

                  {outstanding > 0 && (
                    <button
                      type="button"
                      disabled
                      className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-xs font-black text-white opacity-70 sm:w-auto"
                      style={{
                        backgroundColor:
                          SCHOOL_BLUE,
                      }}
                      title="Online payment will be enabled after payment gateway setup"
                    >
                      <CreditCard size={16} />
                      Pay Now
                    </button>
                  )}

                </div>

              </section>

              {/* =================================================
                  PAYMENT HISTORY
              ================================================== */}

              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(1,0,102,0.035)]">

                <div className="border-b border-slate-100 p-6 sm:p-7">

                  <div className="flex items-start gap-4">

                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${SCHOOL_GOLD}15`,
                        color: SCHOOL_GOLD,
                      }}
                    >
                      <Clock3 size={19} />
                    </div>

                    <div>

                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Transactions
                      </p>

                      <h2
                        className="mt-1 text-base font-black"
                        style={{
                          color:
                            SCHOOL_BLUE_DARK,
                        }}
                      >
                        Payment history
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        A record of payments made on
                        this bill.
                      </p>

                    </div>

                  </div>

                </div>

                {payments.length === 0 ? (

                  <div className="p-8 text-center sm:p-10">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                      <Receipt size={20} />
                    </div>

                    <p className="mt-4 text-sm font-black text-slate-600">
                      No payments recorded
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Your payment transactions will
                      appear here once payments are
                      made.
                    </p>

                  </div>

                ) : (

                  <div className="divide-y divide-slate-100">

                    {payments.map(
                      (payment) => {

                        const status =
                          getPaymentStatus(
                            payment.status,
                          );

                        return (
                          <div
                            key={payment.id}
                            className="p-5 sm:p-6"
                          >

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                              <div className="flex items-start gap-3">

                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    status ===
                                    "successful"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : status ===
                                          "pending"
                                        ? "bg-amber-50 text-amber-600"
                                        : "bg-red-50 text-red-500"
                                  }`}
                                >

                                  {status ===
                                  "successful" ? (
                                    <CheckCircle2
                                      size={18}
                                    />
                                  ) : status ===
                                    "pending" ? (
                                    <Clock3
                                      size={18}
                                    />
                                  ) : (
                                    <AlertCircle
                                      size={18}
                                    />
                                  )}

                                </div>

                                <div>

                                  <p className="text-sm font-black text-slate-700">
                                    {formatCurrency(
                                      Number(
                                        payment.amount ||
                                          0,
                                      ),
                                    )}
                                  </p>

                                  <p className="mt-1 text-[10px] text-slate-400">
                                    {formatDate(
                                      payment.paid_at ??
                                        payment.created_at,
                                    )}
                                  </p>

                                  {payment.reference && (
                                    <p className="mt-1 break-all text-[10px] text-slate-400">
                                      Ref:{" "}
                                      {
                                        payment.reference
                                      }
                                    </p>
                                  )}

                                </div>

                              </div>

                              <div className="flex flex-wrap items-center gap-2 sm:justify-end">

                                <span
                                  className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${
                                    status ===
                                    "successful"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : status ===
                                          "pending"
                                        ? "bg-amber-50 text-amber-600"
                                        : "bg-red-50 text-red-500"
                                  }`}
                                >
                                  {payment.status ??
                                    "Unknown"}
                                </span>

                                {payment.payment_method && (
                                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                    {
                                      payment.payment_method
                                    }
                                  </span>
                                )}

                              </div>

                            </div>

                          </div>
                        );
                      },
                    )}

                  </div>

                )}

              </section>

            </>
          )}

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="pb-5 text-center">

            <Link
              href="/student-dashboard"
              className="inline-flex items-center gap-2 text-xs font-bold transition hover:opacity-70"
              style={{
                color: SCHOOL_BLUE,
              }}
            >
              Back to Student Dashboard
              <ArrowRight size={14} />
            </Link>

          </div>

        </div>

      </main>

    </div>
  );
}

/* =====================================================
   SUMMARY CARD
===================================================== */

function SummaryCard({
  icon,
  label,
  value,
  description,
  valueClassName = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-6">

      <div className="flex items-center gap-3">

        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${SCHOOL_BLUE}08`,
            color: SCHOOL_BLUE,
          }}
        >
          {icon}
        </div>

        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>

      </div>

      <p
        className={`mt-5 text-xl font-black tracking-tight ${valueClassName}`}
        style={
          valueClassName
            ? undefined
            : {
                color:
                  SCHOOL_BLUE_DARK,
              }
        }
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {description}
      </p>

    </div>
  );
}
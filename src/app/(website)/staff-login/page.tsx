"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
  UserRound,
} from "lucide-react";
import { motion } from "motion/react";
import { FormEvent, useEffect, useState } from "react";

import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
  siteConfig,
} from "@/config/site";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function StaffPortalPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [error, setError] = useState("");

  /*
   * Check whether the staff member is already signed in.
   */
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: staff, error: staffError } = await supabase
            .from("staff")
            .select("id, user_id, staff_id, department, position, status")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!staffError && staff && staff.status === "active") {
            router.push("/staff-dashboard");
            return;
          }

          await supabase.auth.signOut();
        }
      } catch {
        // Ignore session-check errors.
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkExistingSession();
  }, []);

  /*
   * Resolve either:
   *
   * Email
   * OR
   * Staff ID
   *
   * into an email address that Supabase Auth can use.
   */
  const resolveLoginEmail = async (identifier: string) => {
    const value = identifier.trim();

    if (value.includes("@")) {
      return value;
    }

    const { data, error: rpcError } = await supabase.rpc(
      "get_staff_login_email",
      {
        input_staff_id: value,
      },
    );

    if (rpcError) {
      console.error("Staff lookup error:", rpcError);
      throw new Error("We could not verify your staff ID.");
    }

    if (!data) {
      throw new Error(
        "No active staff account was found with that Staff ID.",
      );
    }

    return data;
  };

  /*
   * Handle login.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    const identifier = staffId.trim();

    if (!identifier) {
      setError("Please enter your Staff ID or email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      /*
       * Resolve Staff ID → Email
       */
      const email = await resolveLoginEmail(identifier);

      /*
       * Authenticate through Supabase Auth
       */
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError || !data.user) {
        throw new Error(
          "The email/Staff ID or password you entered is incorrect.",
        );
      }

      /*
       * Verify that this Auth account actually belongs
       * to a staff member.
       */
      const { data: staff, error: staffError } = await supabase
        .from("staff")
        .select(
          "id, user_id, staff_id, department, position, status",
        )
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (staffError || !staff) {
        await supabase.auth.signOut();

        throw new Error(
          "This account is not registered as a staff account.",
        );
      }

      /*
       * Check staff account status.
       */
      if (staff.status !== "active") {
        await supabase.auth.signOut();

        if (staff.status === "suspended") {
          throw new Error(
            "Your staff account has been suspended. Please contact the school administration.",
          );
        }

        throw new Error(
          "Your staff account is currently inactive. Please contact the school administration.",
        );
      }

      /*
       * Successful login.
       */
      router.push("/staff-dashboard");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * Avoid flashing the login form while checking
   * an existing authentication session.
   */
  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `${SCHOOL_BLUE}08`,
              color: SCHOOL_BLUE,
            }}
          >
            <Loader2 className="animate-spin" size={21} />
          </div>

          <p className="text-xs font-semibold text-slate-400">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          PORTAL BACKGROUND
      ====================================================== */}

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-6">
        {/* Decorative background glow */}

        <div
          aria-hidden="true"
          className="absolute -left-32 -top-32 h-80 w-80 rounded-full blur-3xl"
          style={{
            backgroundColor: `${SCHOOL_BLUE}08`,
          }}
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl"
          style={{
            backgroundColor: `${SCHOOL_GOLD}12`,
          }}
        />

        {/* =================================================
            MAIN PORTAL CONTENT
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative z-10 w-full max-w-md pt-20 sm:pt-24 lg:pt-28"
        >
          {/* =================================================
              SCHOOL LOGO + NAME
          ================================================== */}

          <div className="mb-8 text-center">
            <Link
              href="/"
              className="group inline-flex flex-col items-center"
            >
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(1,0,102,0.10)] ring-1 ring-slate-200 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_16px_40px_rgba(1,0,102,0.16)]">
                <Image
                  src="/images/al-ishad-logo.jpeg"
                  alt={`${siteConfig.name} logo`}
                  fill
                  priority
                  sizes="80px"
                  className="object-contain p-2"
                />
              </div>

              <p
                className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_BLUE,
                }}
              >
                MSSN Al-Irshad
              </p>

              <h1
                className="mt-1 text-2xl font-bold tracking-tight"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Model School
              </h1>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Ila Orangun, Nigeria
              </p>
            </Link>
          </div>

          {/* =================================================
              LOGIN CARD
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.5,
              delay: 0.08,
            }}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_25px_80px_rgba(1,0,102,0.09)] sm:p-8"
          >
            {/* Portal Header */}

            <div className="text-center">
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}08`,
                  color: SCHOOL_BLUE,
                }}
              >
                <LockKeyhole size={21} />
              </div>

              <h2
                className="mt-5 text-2xl font-bold tracking-tight"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Staff Portal
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Sign in to access your staff account, resources and school
                services.
              </p>
            </div>

            {/* =================================================
                ERROR MESSAGE
            ================================================== */}

            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
              >
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <p className="text-xs font-medium leading-5 text-red-600">
                  {error}
                </p>
              </motion.div>
            )}

            {/* =================================================
                LOGIN FORM
            ================================================== */}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              {/* Staff ID / Email */}

              <div>
                <label
                  htmlFor="staff-id"
                  className="mb-2 block text-xs font-bold text-slate-700"
                >
                  Staff ID or Email
                </label>

                <div className="relative">
                  <UserRound
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="staff-id"
                    name="staffId"
                    type="text"
                    value={staffId}
                    onChange={(event) =>
                      setStaffId(event.target.value)
                    }
                    autoComplete="username"
                    placeholder="Enter your staff ID or email"
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-bold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-[#010066] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isLoading}
                  className="text-xs font-semibold transition-colors duration-200 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    color: SCHOOL_BLUE,
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* =================================================
                  SIGN IN BUTTON
              ================================================== */}

              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(1,0,102,0.22)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                  color: "#ffffff",
                }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 origin-left scale-x-0 bg-[#00004D] transition-transform duration-300 group-hover:scale-x-100"
                />

                <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                  {isLoading ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In

                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: `${SCHOOL_GOLD}25`,
                        }}
                      >
                        <ArrowRight
                          size={14}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </span>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* =================================================
                BACK TO WEBSITE
            ================================================== */}

            <div className="mt-7 border-t border-slate-100 pt-6 text-center">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors duration-200 hover:text-[#010066]"
              >
                <ArrowLeft
                  size={14}
                  className="transition-transform duration-200 group-hover:-translate-x-1"
                />

                <span>Back to school website</span>
              </Link>
            </div>
          </motion.div>

          {/* =================================================
              COPYRIGHT
          ================================================== */}

          <p className="mt-6 text-center text-[10px] font-medium text-slate-400">
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
        </motion.div>
      </div>
    </main>
  );
}
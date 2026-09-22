"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
} from "@/config/site";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (!email.trim() || !password) {
        setError("Please enter your email address and password.");
        setLoading(false);
        return;
      }

      // 1. Authenticate with Supabase
      const { data: authData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError || !authData.user) {
        setError("Invalid email address or password.");
        setLoading(false);
        return;
      }

      // 2. Get the user's profile and role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, first_name, last_name, email")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        // User authenticated but has no profile.
        await supabase.auth.signOut();

        setError(
          "Your account profile could not be found. Please contact the school administrator."
        );

        setLoading(false);
        return;
      }

      // 3. Check Admin Portal authorization
      const allowedRoles = ["admin", "developer"];

      if (!allowedRoles.includes(profile.role)) {
        // Valid account, but not authorized for Admin Portal.
        await supabase.auth.signOut();

        setError(
          "You are not authorized to access the administration portal."
        );

        setLoading(false);
        return;
      }

      // 4. Authorized Admin/Developer
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      console.error("Admin login error:", error);

      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT SIDE */}
        <section
          className="relative hidden overflow-hidden lg:flex"
          style={{
            background: `linear-gradient(135deg, ${SCHOOL_BLUE_DARK}, ${SCHOOL_BLUE})`,
          }}
        >
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-white/5" />
          <div className="absolute right-20 top-24 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            {/* Logo */}
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-4"
              >
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
                  <img
                    src="/images/al-ishad-logo.jpeg"
                    alt="MSSN Al-Irshad Model School"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="text-white">
                  <p className="text-lg font-bold tracking-tight">
                    MSSN Al-Irshad
                  </p>

                  <p className="text-sm text-white/70">
                    Model School
                  </p>
                </div>
              </Link>
            </div>

            {/* Main message */}
            <div className="max-w-xl">
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
                style={{
                  borderColor: `${SCHOOL_GOLD}55`,
                  backgroundColor: `${SCHOOL_GOLD}15`,
                  color: SCHOOL_GOLD,
                }}
              >
                <ShieldCheck size={17} />
                Secure Administration Portal
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Manage your school.
                <span className="block text-white/70">
                  Empower your community.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-white/70">
                Access the school administration system to manage
                students, teachers, academics, results, sessions,
                and other important school operations.
              </p>
            </div>

            {/* Footer */}
            <div className="text-sm text-white/50">
              © {new Date().getFullYear()} MSSN Al-Irshad Model School
            </div>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-10 flex flex-col items-center text-center lg:hidden">
              <Link
                href="/"
                className="flex flex-col items-center"
              >
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
                  <img
                    src="/images/al-ishad-logo.jpeg"
                    alt="MSSN Al-Irshad Model School"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="mt-4">
                  <h1
                    className="text-lg font-bold"
                    style={{ color: SCHOOL_BLUE_DARK }}
                  >
                    MSSN Al-Irshad Model School
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Administration Portal
                  </p>
                </div>
              </Link>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <p
                className="mb-3 text-sm font-semibold uppercase tracking-wider"
                style={{ color: SCHOOL_GOLD }}
              >
                Admin Portal
              </p>

              <h2
                className="text-3xl font-bold tracking-tight"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to access the school administration dashboard.
              </p>
            </div>

            {/* Login Card */}
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                    {error}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={19}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="admin@example.com"
                      autoComplete="email"
                      disabled={loading}
                      className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      className="text-xs font-semibold transition hover:underline"
                      style={{ color: SCHOOL_BLUE }}
                      onClick={() => {
                        // Forgot-password flow will be added later.
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      size={19}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                      className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  style={{
                    background: `linear-gradient(135deg, ${SCHOOL_BLUE}, ${SCHOOL_BLUE_DARK})`,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to Admin
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Security note */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
              <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
                <ShieldCheck size={17} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Secure access
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  This area is restricted to authorized school
                  administrators.
                </p>
              </div>
            </div>

            {/* Back to school */}
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
              >
                ← Back to school website
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
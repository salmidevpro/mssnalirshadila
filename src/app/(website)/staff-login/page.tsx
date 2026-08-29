"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
  siteConfig,
} from "@/config/site";

export default function StaffPortalPage() {
  const [showPassword, setShowPassword] = useState(false);

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
              {/* School Logo */}

              <div  
                className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(1,0,102,0.10)] ring-1 ring-slate-200 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_16px_40px_rgba(1,0,102,0.16)]"
              >
                <Image
                  src="/images/al-ishad-logo.jpeg"
                  alt={`${siteConfig.name} logo`}
                  fill
                  priority
                  sizes="80px"
                  className="object-contain p-2"
                />
              </div>

              {/* School Name */}

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
                LOGIN FORM
            ================================================== */}

            <form className="mt-8 space-y-5">
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
                    autoComplete="username"
                    placeholder="Enter your staff ID or email"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5"
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
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5"
                  />

                  {/* Show / Hide Password */}

                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-[#010066]"
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
                  className="text-xs font-semibold transition-colors duration-200 hover:underline"
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
                className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(1,0,102,0.22)]"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                  color: "#ffffff",
                }}
              >
                {/* Hover background */}

                <span
                  aria-hidden="true"
                  className="absolute inset-0 origin-left scale-x-0 bg-[#00004D] transition-transform duration-300 group-hover:scale-x-100"
                />

                {/* Button text */}

                <span className="relative z-10 whitespace-nowrap">
                  Sign In
                </span>

                {/* Arrow */}

                <span
                  className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `${SCHOOL_GOLD}25`,
                  }}
                >
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
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
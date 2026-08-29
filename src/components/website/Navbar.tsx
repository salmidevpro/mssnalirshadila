"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
  siteConfig,
} from "@/config/site";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobile = () => {
    setMobileOpen(false);
    setPortalOpen(false);
  };

  return (
    <motion.header
      initial={{
        opacity: 0,
        y: -20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="fixed inset-x-0 top-0 z-50 px-2 pt-2 sm:px-4 lg:px-6 lg:pt-3"
    >
      <nav
        className={`
          mx-auto max-w-375
          overflow-visible
          rounded-2xl
          border
          transition-all
          duration-500
          ${
            scrolled
              ? "border-slate-200 bg-white/95 shadow-[0_14px_45px_rgba(1,0,102,0.12)] backdrop-blur-xl"
              : "border-slate-100 bg-white shadow-[0_10px_40px_rgba(1,0,102,0.08)]"
          }
        `}
      >
        {/* =====================================================
            MAIN NAVBAR
        ====================================================== */}

        <div className="flex min-h-19 items-center justify-between px-3 sm:px-5 lg:min-h-22 lg:px-6">
          {/* =================================================
              SCHOOL BRANDING
          ================================================== */}

          <Link
            href="/"
            onClick={closeMobile}
            className="group flex min-w-0 items-center gap-2.5 sm:gap-3 lg:gap-4"
          >
            {/* MSSN LOGO */}

            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 transition-all duration-300 group-hover:scale-105 group-hover:ring-[#FFAF2E]/50 sm:h-12 sm:w-12 lg:h-14 lg:w-14">
              <Image
                src="/images/mssn-logo.jpg"
                alt="MSSN logo"
                fill
                priority
                sizes="56px"
                className="object-contain p-1"
              />
            </div>

            {/* GOLD DIVIDER */}

            <div
              className="hidden h-12 w-px sm:block lg:h-14"
              style={{
                backgroundColor: SCHOOL_GOLD,
                opacity: 0.65,
              }}
            />

            {/* FORMER AL-IRSHAD LOGO */}

            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 transition-all duration-300 group-hover:scale-105 group-hover:ring-[#FFAF2E]/50 sm:h-12 sm:w-12 lg:h-14 lg:w-14">
              <Image
                src="/images/al-ishad-logo.jpeg"
                alt="Al-Irshad Islamic School logo"
                fill
                priority
                sizes="56px"
                className="object-contain p-1"
              />
            </div>

            {/* SCHOOL NAME */}

            <div className="min-w-0">
              <h1
                className="
                  whitespace-nowrap
                  text-[13px]
                  font-black
                  uppercase
                  leading-[1.05]
                  tracking-tight
                  sm:text-[16px]
                  lg:text-[20px]
                  xl:text-[22px]
                "
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                MSSN AL-IRSHAD
                <br />
                ISLAMIC SCHOOL
              </h1>

              {/* MOTTO */}

              <p
                className="
                  mt-1
                  hidden
                  text-[8px]
                  font-semibold
                  italic
                  leading-tight
                  tracking-[-0.01em]
                  text-slate-500
                  sm:block
                  lg:text-[9px]
                  xl:text-[10px]
                "
              >
                ...concretising faith through knowledge acquisition
              </p>
            </div>
          </Link>

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================== */}

          <div className="hidden items-center gap-0.5 xl:flex">
            {siteConfig.navigation
              .filter((item) => item.label !== "Portal")
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="
                    group
                    relative
                    rounded-full
                    px-3.5
                    py-3
                    text-[12px]
                    font-semibold
                    text-slate-700
                    transition-colors
                    duration-300
                    hover:text-[#010066]
                  "
                >
                  <span className="relative z-10">
                    {item.label}
                  </span>

                  {/* GOLD HOVER LINE */}

                  <span
                    className="
                      absolute
                      bottom-1.5
                      left-3.5
                      right-3.5
                      h-0.5
                      origin-left
                      scale-x-0
                      rounded-full
                      bg-[#FFAF2E]
                      transition-transform
                      duration-300
                      group-hover:scale-x-100
                    "
                  />
                </Link>
              ))}

            {/* =================================================
                PORTAL DROPDOWN
            ================================================== */}

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setPortalOpen((value) => !value)
                }
                className="
                  group
                  relative
                  flex
                  items-center
                  gap-1.5
                  rounded-full
                  px-3.5
                  py-3
                  text-[12px]
                  font-semibold
                  text-slate-700
                  transition-colors
                  duration-300
                  hover:text-[#010066]
                "
              >
                <span>Portal</span>

                <ChevronDown
                  size={14}
                  className={`
                    transition-transform
                    duration-300
                    ${portalOpen ? "rotate-180" : ""}
                  `}
                />

                <span
                  className="
                    absolute
                    bottom-1.5
                    left-3.5
                    right-3.5
                    h-0.5
                    origin-left
                    scale-x-0
                    rounded-full
                    bg-[#FFAF2E]
                    transition-transform
                    duration-300
                    group-hover:scale-x-100
                  "
                />
              </button>

              <AnimatePresence>
                {portalOpen && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 8,
                      scale: 0.97,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: 8,
                      scale: 0.97,
                    }}
                    transition={{
                      duration: 0.2,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="
                      absolute
                      right-0
                      top-full
                      mt-3
                      w-72
                      overflow-hidden
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      p-2
                      shadow-[0_20px_60px_rgba(1,0,102,0.14)]
                    "
                  >
                    {siteConfig.portalNavigation.map(
                      (item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() =>
                            setPortalOpen(false)
                          }
                          className="
                            group
                            flex
                            items-center
                            justify-between
                            rounded-xl
                            p-3
                            transition-all
                            duration-200
                            hover:bg-slate-50
                          "
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-800 transition-colors duration-200 group-hover:text-[#010066]">
                              {item.label}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {item.description}
                            </p>
                          </div>

                          <span
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-[#010066]/5
                              text-[#010066]
                              transition-all
                              duration-300
                              group-hover:-translate-y-0.5
                              group-hover:translate-x-0.5
                              group-hover:bg-[#FFAF2E]/20
                            "
                          >
                            <ArrowUpRight size={14} />
                          </span>
                        </Link>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* =================================================
              MOBILE MENU BUTTON
          ================================================== */}

          <button
            type="button"
            aria-label={
              mobileOpen ? "Close menu" : "Open menu"
            }
            aria-expanded={mobileOpen}
            onClick={() =>
              setMobileOpen((value) => !value)
            }
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              text-[#010066]
              transition-all
              duration-300
              hover:border-[#010066]/20
              hover:bg-[#010066]/5
              hover:shadow-md
              xl:hidden
            "
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span
                  key="close"
                  initial={{
                    opacity: 0,
                    rotate: -90,
                    scale: 0.8,
                  }}
                  animate={{
                    opacity: 1,
                    rotate: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    rotate: 90,
                    scale: 0.8,
                  }}
                >
                  <X size={21} />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{
                    opacity: 0,
                    rotate: 90,
                    scale: 0.8,
                  }}
                  animate={{
                    opacity: 1,
                    rotate: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    rotate: -90,
                    scale: 0.8,
                  }}
                >
                  <Menu size={21} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* =====================================================
            MOBILE NAVIGATION
        ====================================================== */}

        <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.div
              initial={{
                height: 0,
                opacity: 0,
              }}
              animate={{
                height: "auto",
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="overflow-hidden border-t border-slate-100 xl:hidden"
            >
              <div className="max-h-[75vh] overflow-y-auto px-4 pb-5 pt-2">
                {/* MOBILE BRAND MOTTO */}

                <div className="mb-2 rounded-xl bg-[#010066]/3 px-3 py-3">
                  <p
                    className="text-[9px] font-bold uppercase tracking-[0.15em]"
                    style={{
                      color: SCHOOL_BLUE,
                    }}
                  >
                    MSSN Al-Irshad Islamic School
                  </p>

                  <p className="mt-1 text-[10px] italic text-slate-400">
                    ...concretising faith through knowledge acquisition
                  </p>
                </div>

                {/* NAV ITEMS */}

                {siteConfig.navigation
                  .filter(
                    (item) => item.label !== "Portal"
                  )
                  .map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{
                        opacity: 0,
                        x: -10,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        delay: index * 0.035,
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={closeMobile}
                        className="
                          group
                          flex
                          items-center
                          justify-between
                          border-b
                          border-slate-100
                          py-4
                          text-sm
                          font-semibold
                          text-slate-700
                          transition-colors
                          duration-300
                          hover:text-[#010066]
                        "
                      >
                        <span>
                          {item.label}
                        </span>

                        <span
                          className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-full
                            bg-slate-50
                            text-[#010066]
                            transition-all
                            duration-300
                            group-hover:-translate-y-0.5
                            group-hover:translate-x-0.5
                            group-hover:bg-[#FFAF2E]/20
                          "
                        >
                          <ArrowUpRight size={14} />
                        </span>
                      </Link>
                    </motion.div>
                  ))}

                {/* =================================================
                    MOBILE PORTAL
                ================================================== */}

                <div className="border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      setPortalOpen((value) => !value)
                    }
                    className="
                      flex
                      w-full
                      items-center
                      justify-between
                      py-4
                      text-sm
                      font-semibold
                      text-slate-700
                      transition-colors
                      duration-300
                      hover:text-[#010066]
                    "
                  >
                    <span>Portal</span>

                    <ChevronDown
                      size={17}
                      className={`
                        text-[#010066]
                        transition-transform
                        duration-300
                        ${
                          portalOpen
                            ? "rotate-180"
                            : ""
                        }
                      `}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {portalOpen && (
                      <motion.div
                        initial={{
                          height: 0,
                          opacity: 0,
                        }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                        }}
                        transition={{
                          duration: 0.25,
                        }}
                        className="overflow-hidden pb-3"
                      >
                        <div className="grid gap-2">
                          {siteConfig.portalNavigation.map(
                            (item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeMobile}
                                className="
                                  group
                                  flex
                                  items-center
                                  justify-between
                                  rounded-xl
                                  bg-slate-50
                                  p-3
                                  transition-all
                                  duration-300
                                  hover:-translate-y-0.5
                                  hover:bg-[#010066]/5
                                  hover:shadow-sm
                                "
                              >
                                <div>
                                  <p className="text-sm font-bold text-[#010066]">
                                    {item.label}
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    {item.description}
                                  </p>
                                </div>

                                <span
                                  className="
                                    flex
                                    h-8
                                    w-8
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-white
                                    text-[#010066]
                                    shadow-sm
                                    transition-all
                                    duration-300
                                    group-hover:bg-[#FFAF2E]/20
                                  "
                                >
                                  <ArrowUpRight
                                    size={15}
                                  />
                                </span>
                              </Link>
                            )
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
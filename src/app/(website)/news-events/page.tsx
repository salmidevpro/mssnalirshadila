"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Newspaper,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

const newsItems = [
  {
    category: "School News",
    date: "Latest Update",
    title: "Welcome to MSSN Al-Irshad Model School",
    description:
      "Stay informed about important school developments, academic activities, student achievements and announcements from MSSN Al-Irshad Model School.",
  },
  {
    category: "Academics",
    date: "Academic Update",
    title: "Building Excellence Through Quality Education",
    description:
      "Our academic environment is designed to help students develop strong knowledge, discipline, critical thinking and a lifelong commitment to learning.",
  },
  {
    category: "Student Life",
    date: "School Community",
    title: "Developing Character Beyond the Classroom",
    description:
      "Students are encouraged to participate in activities that strengthen leadership, responsibility, teamwork, Islamic values and personal development.",
  },
];

const events = [
  {
    type: "Academic",
    title: "Academic Activities",
    date: "Throughout the Session",
    description:
      "Academic programmes, assessments and learning activities designed to support continuous student development.",
  },
  {
    type: "Islamic",
    title: "Islamic Programmes",
    date: "Throughout the Session",
    description:
      "Meaningful Islamic activities that nurture faith, character, discipline and a strong sense of responsibility.",
  },
  {
    type: "School",
    title: "School Community Events",
    date: "Dates Announced by School",
    description:
      "Important school gatherings, student activities and community programmes will be announced here.",
  },
];

export default function NewsEventsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        className="relative overflow-hidden pt-32 sm:pt-36 lg:pt-40"
        style={{
          background: `linear-gradient(
            135deg,
            ${SCHOOL_BLUE_DARK} 0%,
            ${SCHOOL_BLUE} 55%,
            #07147a 100%
          )`,
        }}
      >
        {/* Decorative glow */}

        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{
            backgroundColor: `${SCHOOL_GOLD}18`,
          }}
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full blur-3xl"
          style={{
            backgroundColor: "#ffffff08",
          }}
        />

        <div className="container-main relative z-10 px-5 pb-20 sm:px-6 lg:pb-24">
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
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="max-w-3xl"
          >
            {/* Eyebrow */}

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur-sm">
              <Newspaper
                size={14}
                style={{
                  color: SCHOOL_GOLD,
                }}
              />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                News &amp; Events
              </span>
            </div>

            {/* Heading */}

            <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              Stay connected with{" "}
              <span
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                our school.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
              Discover the latest school news, academic updates, student
              activities and important events at MSSN Al-Irshad Model School.
            </p>

            {/* =================================================
                HERO BUTTONS
            ================================================== */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {/* Explore News */}

              <Link
                href="#latest-news"
                className="group relative inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-bold !text-[#00004D] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                style={{
                  backgroundColor: SCHOOL_GOLD,
                  color: SCHOOL_BLUE_DARK,
                  boxShadow: `0 10px 30px ${SCHOOL_GOLD}30`,
                }}
              >
                <span className="relative z-20 !text-[#00004D]">
                  Explore Latest News
                </span>

                <ArrowUpRight
                  size={16}
                  className="relative z-20 !text-[#00004D] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>

              {/* View Events */}

              <Link
                href="#upcoming-events"
                className="group relative inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold !text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:!text-[#010066]"
              >
                <CalendarDays
                  size={16}
                  className="relative z-20 !text-white transition-transform duration-300 group-hover:scale-110 group-hover:!text-[#010066]"
                />

                <span className="relative z-20 !text-white group-hover:!text-[#010066]">
                  View Events
                </span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Gold accent */}

        <div
          aria-hidden="true"
          className="h-1 w-full"
          style={{
            background: `linear-gradient(
              90deg,
              transparent,
              ${SCHOOL_GOLD},
              transparent
            )`,
          }}
        />
      </section>

      {/* =====================================================
          LATEST NEWS
      ====================================================== */}

      <section
        id="latest-news"
        className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28"
      >
        <div className="container-main px-5 sm:px-6">
          {/* Section heading */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.6,
            }}
            className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
          >
            <div className="max-w-2xl">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                Latest Updates
              </p>

              <h2
                className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                What&apos;s happening at Al-Irshad?
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                Keep up with important developments, academic activities and
                stories from our school community.
              </p>
            </div>

            <div className="hidden h-px flex-1 bg-slate-200 md:ml-10 md:mb-2 md:block" />
          </motion.div>

          {/* News cards */}

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {newsItems.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{
                  opacity: 0,
                  y: 25,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.15,
                }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.08,
                }}
                className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(1,0,102,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#010066]/20 hover:shadow-[0_18px_50px_rgba(1,0,102,0.10)] sm:p-7"
              >
                {/* Card top */}

                <div className="flex items-start justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: `${SCHOOL_BLUE}08`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    <Newspaper size={19} />
                  </div>

                  <span
                    className="rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{
                      backgroundColor: `${SCHOOL_GOLD}18`,
                      color: "#8A5A00",
                    }}
                  >
                    {item.category}
                  </span>
                </div>

                <p className="mt-6 text-xs font-medium text-slate-400">
                  {item.date}
                </p>

                <h3
                  className="mt-2 text-xl font-bold tracking-[-0.025em]"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  {item.title}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-7 text-slate-500">
                  {item.description}
                </p>

                {/* Learn more */}

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <Link
                    href="/contact"
                    className="group/link inline-flex items-center gap-2 text-sm font-bold !text-[#010066] transition-colors duration-300"
                  >
                    <span className="!text-[#010066]">Learn More</span>

                    <ArrowUpRight
                      size={15}
                      className="!text-[#010066] transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                    />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          UPCOMING EVENTS
      ====================================================== */}

      <section
        id="upcoming-events"
        className="scroll-mt-24 border-y border-slate-200 bg-slate-50 py-20 sm:py-24 lg:py-28"
      >
        <div className="container-main px-5 sm:px-6">
          {/* Heading */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.6,
            }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}08`,
                  color: SCHOOL_BLUE,
                }}
              >
                <CalendarDays size={18} />
              </div>

              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                Upcoming Events
              </p>
            </div>

            <h2
              className="mt-5 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              Important dates and activities
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              School events and important activities will be published here
              to help students, parents and members of our community stay
              informed.
            </p>
          </motion.div>

          {/* Events */}

          <div className="mt-12 grid gap-5">
            {events.map((event, index) => (
              <motion.article
                key={event.title}
                initial={{
                  opacity: 0,
                  x: -20,
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.15,
                }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.08,
                }}
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.04)] transition-all duration-300 hover:border-[#010066]/20 hover:shadow-[0_15px_40px_rgba(1,0,102,0.08)] sm:p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  {/* Event icon */}

                  <div
                    className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: SCHOOL_BLUE,
                      color: "#ffffff",
                    }}
                  >
                    <CalendarDays size={18} />

                    <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/70">
                      Event
                    </span>
                  </div>

                  {/* Event content */}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em]"
                        style={{
                          backgroundColor: `${SCHOOL_GOLD}18`,
                          color: "#8A5A00",
                        }}
                      >
                        {event.type}
                      </span>

                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock3 size={13} />
                        {event.date}
                      </span>
                    </div>

                    <h3
                      className="mt-2 text-lg font-bold"
                      style={{
                        color: SCHOOL_BLUE_DARK,
                      }}
                    >
                      {event.title}
                    </h3>

                    <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                      {event.description}
                    </p>
                  </div>

                  {/* Details button */}

                  <Link
                    href="/contact"
                    className="group/event relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full border px-5 py-3 text-sm font-bold !text-[#010066] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    style={{
                      borderColor: `${SCHOOL_BLUE}20`,
                      backgroundColor: `${SCHOOL_BLUE}06`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    <span className="relative z-20 !text-[#010066]">
                      Details
                    </span>

                    <ArrowUpRight
                      size={15}
                      className="relative z-20 !text-[#010066] transition-transform duration-300 group-hover/event:-translate-y-0.5 group-hover/event:translate-x-0.5"
                    />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          STAY CONNECTED CTA
      ====================================================== */}

      <section className="bg-white py-20 sm:py-24">
        <div className="container-main px-5 sm:px-6">
          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.65,
            }}
            className="relative overflow-hidden rounded-[2rem] px-6 py-12 text-center sm:px-10 sm:py-16"
            style={{
              background: `linear-gradient(
                135deg,
                ${SCHOOL_BLUE_DARK},
                ${SCHOOL_BLUE}
              )`,
            }}
          >
            {/* Glow */}

            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl"
              style={{
                backgroundColor: `${SCHOOL_GOLD}18`,
              }}
            />

            <Sparkles
              aria-hidden="true"
              className="absolute right-7 top-7 opacity-20"
              size={28}
              style={{
                color: SCHOOL_GOLD,
              }}
            />

            <div className="relative z-10 mx-auto max-w-2xl">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                Stay Connected
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
                Never miss an important school update.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
                For enquiries about school activities, admissions or upcoming
                programmes, our school team is available to assist you.
              </p>

              {/* =================================================
                  CTA BUTTONS
              ================================================== */}

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                {/* Contact */}

                <Link
                  href="/contact"
                  className="group relative inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-bold !text-[#00004D] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{
                    backgroundColor: SCHOOL_GOLD,
                    color: SCHOOL_BLUE_DARK,
                    boxShadow: `0 10px 30px ${SCHOOL_GOLD}25`,
                  }}
                >
                  <span className="relative z-20 !text-[#00004D]">
                    Contact the School
                  </span>

                  <ArrowUpRight
                    size={16}
                    className="relative z-20 !text-[#00004D] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>

                {/* Admissions */}

                <Link
                  href="/admissions"
                  className="group relative inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold !text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:!text-[#010066]"
                >
                  <span className="relative z-20 !text-white group-hover:!text-[#010066]">
                    Admissions
                  </span>

                  <ArrowUpRight
                    size={16}
                    className="relative z-20 !text-white transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:!text-[#010066]"
                  />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
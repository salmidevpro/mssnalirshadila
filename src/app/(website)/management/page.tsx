"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

const management = [
  {
    name: "Management Profile",
    position: "School Administrator",
    image: "/images/management/administrator.png",
    description:
      "Providing strategic leadership and ensuring that the school's academic, administrative and institutional objectives are effectively achieved.",
  },
  {
    name: "Management Profile",
    position: "Head of School",
    image: "/images/management/administrator.png",
    description:
      "Leading the school's educational direction while fostering an environment where students can grow in knowledge, character and faith.",
  },
  {
    name: "Management Profile",
    position: "Academic Coordinator",
    image: "/images/management/administrator.png",
    description:
      "Supporting academic excellence through effective curriculum coordination, teaching standards and continuous improvement.",
  },
];

const leadershipValues = [
  {
    icon: ShieldCheck,
    title: "Integrity",
    description:
      "We promote responsible leadership grounded in honesty, accountability and Islamic values.",
  },
  {
    icon: BookOpen,
    title: "Knowledge",
    description:
      "We believe quality education is essential to developing capable and confident future leaders.",
  },
  {
    icon: Users,
    title: "Service",
    description:
      "Our leadership exists to serve students, staff, parents and the wider school community.",
  },
  {
    icon: Award,
    title: "Excellence",
    description:
      "We continually strive for high standards in education, character development and school administration.",
  },
];

export default function SchoolManagementPage() {
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
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl"
          style={{
            backgroundColor: `${SCHOOL_GOLD}18`,
          }}
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full blur-3xl"
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
              <Users
                size={14}
                style={{
                  color: SCHOOL_GOLD,
                }}
              />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                School Management
              </span>
            </div>

            {/* Heading */}

            <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              Leadership with{" "}
              <span
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                purpose.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
              Meet the leadership responsible for guiding MSSN Al-Irshad Model
              School towards academic excellence, strong Islamic character and
              meaningful development of every learner.
            </p>

            {/* Buttons */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#management-team"
                className="group relative inline-flex min-h-[50px] items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(255,175,46,0.30)]"
                style={{
                  backgroundColor: SCHOOL_GOLD,
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                {/* Shine */}

                <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />

                <span className="relative z-10 whitespace-nowrap">
                  Meet the Management
                </span>

                <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
                  <ArrowUpRight
                    size={15}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
              </Link>

              <Link
                href="/contact"
                className="group inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white hover:text-[#010066] hover:shadow-[0_15px_35px_rgba(0,0,0,0.18)]"
              >
                <span className="whitespace-nowrap">
                  Contact the School
                </span>

                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-colors duration-300 group-hover:bg-[#010066]/10">
                  <ArrowUpRight
                    size={15}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
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
          INTRODUCTION
      ====================================================== */}

      <section className="bg-white py-20 sm:py-24 lg:py-28">
        <div className="container-main px-5 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20">
            {/* Left */}

            <motion.div
              initial={{
                opacity: 0,
                x: -25,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={{
                duration: 0.6,
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                Leadership & Governance
              </p>

              <h2
                className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Guiding the school with vision and responsibility.
              </h2>
            </motion.div>

            {/* Right */}

            <motion.div
              initial={{
                opacity: 0,
                x: 25,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={{
                duration: 0.6,
                delay: 0.1,
              }}
            >
              <p className="text-sm leading-8 text-slate-500 sm:text-base">
                The management of MSSN Al-Irshad Model School is committed to
                creating an educational environment where Islamic values and
                quality learning work together to prepare students for the
                future.
              </p>

              <p className="mt-5 text-sm leading-8 text-slate-500 sm:text-base">
                Through responsible administration, strong academic standards
                and continuous collaboration with staff and parents, the
                school seeks to provide an environment where every learner can
                discover their potential and develop into a responsible member
                of society.
              </p>

              <div className="mt-7">
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-2 text-sm font-bold"
                  style={{
                    color: SCHOOL_BLUE,
                  }}
                >
                  <span>Learn About Our School</span>

                  <ArrowUpRight
                    size={15}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MANAGEMENT TEAM
      ====================================================== */}

      <section
        id="management-team"
        className="scroll-mt-24 border-y border-slate-200 bg-slate-50 py-20 sm:py-24 lg:py-28"
      >
        <div className="container-main px-5 sm:px-6">
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
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{
                color: SCHOOL_GOLD,
              }}
            >
              Our Leadership
            </p>

            <h2
              className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              Meet the school management.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              Our management team provides the leadership, coordination and
              oversight required to maintain a strong educational institution.
            </p>
          </motion.div>

          {/* Management cards */}

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {management.map((person, index) => (
              <motion.article
                key={person.position}
                initial={{
                  opacity: 0,
                  y: 30,
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
                className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(1,0,102,0.05)] transition-all duration-300 hover:-translate-y-2 hover:border-[#010066]/20 hover:shadow-[0_20px_50px_rgba(1,0,102,0.11)]"
              >
                {/* Image */}

                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image
                    src={person.image}
                    alt={person.position}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Image overlay */}

                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

                  <div
                    className="absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em]"
                    style={{
                      backgroundColor: SCHOOL_GOLD,
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    School Leadership
                  </div>
                </div>

                {/* Content */}

                <div className="p-6 sm:p-7">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{
                      color: SCHOOL_GOLD,
                    }}
                  >
                    {person.position}
                  </p>

                  <h3
                    className="mt-2 text-xl font-bold"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    {person.name}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {person.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Note */}

        </div>
      </section>

      {/* =====================================================
          LEADERSHIP VALUES
      ====================================================== */}

      <section className="bg-white py-20 sm:py-24 lg:py-28">
        <div className="container-main px-5 sm:px-6">
          <div className="mx-auto max-w-4xl">
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
              className="text-center"
            >
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}08`,
                  color: SCHOOL_BLUE,
                }}
              >
                <GraduationCap size={22} />
              </div>

              <p
                className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                Our Leadership Principles
              </p>

              <h2
                className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Leadership rooted in faith and excellence.
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Our approach to school leadership reflects our commitment to
                concretising faith through knowledge acquisition.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {leadershipValues.map((value, index) => {
                const Icon = value.icon;

                return (
                  <motion.article
                    key={value.title}
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
                      duration: 0.5,
                      delay: index * 0.07,
                    }}
                    className="group rounded-3xl border border-slate-200 bg-slate-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#010066]/15 hover:bg-white hover:shadow-[0_15px_40px_rgba(1,0,102,0.07)] sm:p-7"
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: `${SCHOOL_BLUE}08`,
                        color: SCHOOL_BLUE,
                      }}
                    >
                      <Icon size={20} />
                    </div>

                    <h3
                      className="mt-5 text-lg font-bold"
                      style={{
                        color: SCHOOL_BLUE_DARK,
                      }}
                    >
                      {value.title}
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      {value.description}
                    </p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}

      <section className="bg-white pb-20 sm:pb-24 lg:pb-28">
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
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl"
              style={{
                backgroundColor: `${SCHOOL_GOLD}18`,
              }}
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full blur-3xl"
              style={{
                backgroundColor: "#ffffff08",
              }}
            />

            <div className="relative z-10 mx-auto max-w-2xl">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                Connect With Us
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
                Learn more about our school community.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
                Whether you are a parent, prospective student or member of our
                wider community, our team is available to assist you.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                {/* Staff */}

                <Link
                  href="/staff"
                  className="group relative inline-flex min-h-[50px] items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(255,175,46,0.30)]"
                  style={{
                    backgroundColor: SCHOOL_GOLD,
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />

                  <span className="relative z-10 whitespace-nowrap">
                    Meet Our Staff
                  </span>

                  <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
                    <ArrowUpRight
                      size={15}
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>

                {/* Contact */}

                <Link
                  href="/contact"
                  className="group inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white hover:text-[#010066]"
                >
                  <span className="whitespace-nowrap">
                    Contact the School
                  </span>

                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-colors duration-300 group-hover:bg-[#010066]/10">
                    <ArrowUpRight
                      size={15}
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
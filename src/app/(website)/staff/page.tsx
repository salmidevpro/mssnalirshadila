"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

type StaffMember = {
  name: string;
  role: string;
  section: "School Management" | "Secondary School" | "Primary School" | "Creche";
  image: string;
  bio: string;
};

const staffMembers: StaffMember[] = [
  {
    name: "Staff Member One",
    role: "School Administrator",
    section: "School Management",
    image: "/images/staff/staff.png",
    bio: "Dedicated to supporting effective school administration, student welfare and the continued development of the school community.",
  },
  {
    name: "Staff Member Two",
    role: "Secondary School Teacher",
    section: "Secondary School",
    image: "/images/staff/staff.png",
    bio: "Committed to helping students develop strong academic foundations, critical thinking skills and responsible character.",
  },
  {
    name: "Staff Member Three",
    role: "Secondary School Teacher",
    section: "Secondary School",
    image: "/images/staff/staff.png",
    bio: "Passionate about creating a supportive learning environment where students can grow in knowledge, confidence and discipline.",
  },
  {
    name: "Staff Member Four",
    role: "Primary School Teacher",
    section: "Primary School",
    image: "/images/staff/staff.png",
    bio: "Focused on nurturing young learners through engaging teaching, positive guidance and strong foundational education.",
  },
  {
    name: "Staff Member Five",
    role: "Primary School Teacher",
    section: "Primary School",
    image: "/images/staff/staff.png",
    bio: "Dedicated to helping children discover their abilities while developing good manners, confidence and a love for learning.",
  },
  {
    name: "Staff Member Six",
    role: "Creche & Early Years Educator",
    section: "Creche",
    image: "/images/staff/staff.png",
    bio: "Committed to providing young children with a safe, caring and stimulating environment for their earliest stages of development.",
  },
];

const sections = [
  {
    title: "School Management",
    description:
      "Providing leadership, coordination and strategic direction for the school community.",
    icon: GraduationCap,
  },
  {
    title: "Secondary School",
    description:
      "Supporting students through structured academic learning, character development and preparation for the future.",
    icon: BookOpen,
  },
  {
    title: "Primary School",
    description:
      "Building strong academic, social and personal foundations for young learners.",
    icon: Users,
  },
  {
    title: "Creche",
    description:
      "Providing nurturing early-years care and learning in a safe and supportive environment.",
    icon: HeartHandshake,
  },
];

export default function StaffPage() {
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

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Users
                size={14}
                style={{
                  color: SCHOOL_GOLD,
                }}
              />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                Our Staff
              </span>
            </div>

            {/* Heading */}

            <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              The people behind{" "}
              <span
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                our students&apos; success.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
              Our staff members play an important role in creating an
              environment where students can learn, develop strong character
              and prepare for meaningful lives.
            </p>

            {/* Buttons */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#staff-directory"
                className="group relative inline-flex min-h-12.5 items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(255,175,46,0.30)]"
                style={{
                  backgroundColor: SCHOOL_GOLD,
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-500 group-hover:translate-x-full" />

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

              <Link
                href="/contact"
                className="group inline-flex min-h-12.5 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white hover:text-[#010066] hover:shadow-[0_15px_35px_rgba(0,0,0,0.18)]"
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

        {/* Gold line */}

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
          INTRO
      ====================================================== */}

      <section className="bg-white py-20 sm:py-24 lg:py-28">
        <div className="container-main px-5 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-20">
            {/* Text */}

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
                Our People
              </p>

              <h2
                className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Dedicated people. Shared purpose.
              </h2>

              <p className="mt-5 text-sm leading-7 text-slate-500 sm:text-base">
                At MSSN Al-Irshad Islamic School, education is a collective
                responsibility. Our administrators, teachers and early-years
                educators work together to create an environment where every
                learner can thrive.
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                Across the Creche, Primary and Secondary sections, our staff
                are committed to academic excellence, Islamic values,
                discipline and the holistic development of our students.
              </p>

              <Link
                href="/about"
                className="group mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(1,0,102,0.25)]"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                }}
              >
                <span>Learn About Our School</span>

                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                  <ArrowUpRight
                    size={15}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </motion.div>

            {/* Highlight Card */}

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
              className="relative"
            >
              <div
                className="relative overflow-hidden rounded-4xl p-7 sm:p-9"
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
                  className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
                  style={{
                    backgroundColor: `${SCHOOL_GOLD}20`,
                  }}
                />

                <div className="relative z-10">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: `${SCHOOL_GOLD}18`,
                      color: SCHOOL_GOLD,
                    }}
                  >
                    <GraduationCap size={22} />
                  </div>

                  <h3 className="mt-6 text-2xl font-bold text-white">
                    One school. One purpose.
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-white/65">
                    Every member of our team contributes to building a school
                    culture where knowledge, faith, discipline and character
                    work together.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {[
                      "Academic excellence",
                      "Islamic values",
                      "Student wellbeing",
                      "Character development",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3"
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: SCHOOL_GOLD,
                          }}
                        />

                        <span className="text-xs font-medium text-white/75">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          STAFF SECTIONS
      ====================================================== */}

      <section className="border-y border-slate-200 bg-slate-50 py-20 sm:py-24 lg:py-28">
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
              Our Structure
            </p>

            <h2
              className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              Supporting every stage of learning.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              Our team works across different sections of the school, with
              each department contributing to the education and development of
              our students.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sections.map((section, index) => {
              const Icon = section.icon;

              return (
                <motion.div
                  key={section.title}
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
                    amount: 0.15,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.07,
                  }}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#010066]/20 hover:shadow-[0_18px_45px_rgba(1,0,102,0.09)]"
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
                    {section.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {section.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          STAFF DIRECTORY
      ====================================================== */}

      <section
        id="staff-directory"
        className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28"
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
              Staff Directory
            </p>

            <h2
              className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              Meet our team.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              Get to know some of the dedicated professionals contributing to
              the growth and development of MSSN Al-Irshad Islamic School.
            </p>
          </motion.div>

          {/* Staff Grid */}

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {staffMembers.map((staff, index) => (
              <motion.article
                key={staff.name}
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
                  amount: 0.12,
                }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.07,
                }}
                className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(1,0,102,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#010066]/20 hover:shadow-[0_20px_50px_rgba(1,0,102,0.11)]"
              >
                {/* Image */}

                <div className="relative aspect-4/4.5 overflow-hidden bg-slate-100">
                  <Image
                    src={staff.image}
                    alt={staff.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Image overlay */}

                  <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/45 to-transparent opacity-70" />

                  {/* Section badge */}

                  <div className="absolute left-4 top-4">
                    <span
                      className="inline-flex rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] shadow-lg backdrop-blur-sm"
                      style={{
                        backgroundColor: `${SCHOOL_BLUE}E6`,
                        color: "#ffffff",
                      }}
                    >
                      {staff.section}
                    </span>
                  </div>
                </div>

                {/* Details */}

                <div className="p-6">
                  <h3
                    className="text-xl font-bold tracking-[-0.02em]"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    {staff.name}
                  </h3>

                  <p
                    className="mt-1 text-sm font-bold"
                    style={{
                      color: SCHOOL_BLUE,
                    }}
                  >
                    {staff.role}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {staff.bio}
                  </p>

                  <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: SCHOOL_GOLD,
                      }}
                    />

                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      MSSN Al-Irshad Islamic School
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* More staff note */}

          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.5,
            }}
            className="mx-auto mt-10 max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-5 text-center"
          >
            <p className="text-sm font-medium leading-6 text-slate-500">
              More members of our teaching and support team will be featured
              here as their profiles and information become available.
            </p>
          </motion.div>
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
            className="relative overflow-hidden rounded-4xl px-6 py-12 text-center sm:px-10 sm:py-16"
            style={{
              background: `linear-gradient(
                135deg,
                ${SCHOOL_BLUE_DARK},
                ${SCHOOL_BLUE}
              )`,
            }}
          >
            {/* Gold glow */}

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
                Our School Community
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
                Great schools are built by great people.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
                Discover more about MSSN Al-Irshad Islamic School and the
                learning environment we are building for our students.
              </p>

              {/* CTA buttons */}

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/about"
                  className="group relative inline-flex min-h-12.5 items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(255,175,46,0.30)]"
                  style={{
                    backgroundColor: SCHOOL_GOLD,
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-500 group-hover:translate-x-full" />

                  <span className="relative z-10 whitespace-nowrap">
                    About Our School
                  </span>

                  <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
                    <ArrowUpRight
                      size={15}
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>

                <Link
                  href="/admissions"
                  className="group inline-flex min-h-12.5 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white hover:text-[#010066] hover:shadow-[0_15px_35px_rgba(0,0,0,0.18)]"
                >
                  <span className="whitespace-nowrap">
                    Explore Admissions
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
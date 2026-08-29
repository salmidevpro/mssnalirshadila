"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  HeartHandshake,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Target,
  Eye,
} from "lucide-react";
import { motion } from "motion/react";

import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
} from "@/config/site";

const values = [
  {
    icon: BookOpen,
    title: "Knowledge",
    description:
      "We promote meaningful learning, intellectual development and the pursuit of beneficial knowledge.",
  },
  {
    icon: HeartHandshake,
    title: "Islamic Character",
    description:
      "We nurture students with sound Islamic values, discipline, good manners and a strong sense of responsibility.",
  },
  {
    icon: ShieldCheck,
    title: "Integrity",
    description:
      "We encourage honesty, accountability, respect and responsible conduct in every aspect of school life.",
  },
  {
    icon: GraduationCap,
    title: "Excellence",
    description:
      "We strive for high standards in academics, personal development, leadership and service to society.",
  },
];

export default function AboutPage() {
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
        {/* Decorative elements */}

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
            className="max-w-4xl"
          >
            {/* Eyebrow */}

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur-sm">
              <Sparkles
                size={14}
                style={{
                  color: SCHOOL_GOLD,
                }}
              />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                About MSSN Al-Irshad
              </span>
            </div>

            {/* Heading */}

            <h1 className="max-w-4xl text-4xl font-bold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Education rooted in{" "}
              <span style={{ color: SCHOOL_GOLD }}>
                faith, knowledge
              </span>{" "}
              and excellence.
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
              MSSN Al-Irshad Islamic School is committed to providing an
              educational environment where academic development, Islamic
              values and character formation work together to prepare students
              for a meaningful future.
            </p>

            {/* Hero buttons */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#our-story"
                className="group relative inline-flex min-h-[50px] items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(255,175,46,0.30)]"
                style={{
                  backgroundColor: SCHOOL_GOLD,
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />

                <span className="relative z-10 whitespace-nowrap">
                  Discover Our Story
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
                className="group relative inline-flex min-h-[50px] items-center justify-center gap-2 overflow-hidden rounded-full border border-white/30 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white hover:text-[#010066] hover:shadow-[0_15px_35px_rgba(0,0,0,0.18)]"
              >
                <span className="relative z-10 whitespace-nowrap">
                  Explore Admissions
                </span>

                <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-colors duration-300 group-hover:bg-[#010066]/10">
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
          OUR STORY
      ====================================================== */}

      <section
        id="our-story"
        className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28"
      >
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
                Who We Are
              </p>

              <h2
                className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Building minds. Shaping character. Inspiring purpose.
              </h2>

              <p className="mt-5 text-sm leading-7 text-slate-500 sm:text-base">
                MSSN Al-Irshad Islamic School exists to provide a balanced
                educational experience that combines academic excellence with
                Islamic upbringing and responsible citizenship.
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                We believe that true education goes beyond passing
                examinations. It should develop the intellect, strengthen
                character, nurture faith and equip young people with the
                knowledge and skills required to positively influence their
                families, communities and the wider society.
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                Through a supportive learning environment, dedicated staff and
                a commitment to continuous improvement, we seek to give every
                learner the opportunity to grow academically, morally and
                personally.
              </p>

              {/* Button */}

              <Link
                href="/academics"
                className="group relative mt-7 inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(1,0,102,0.25)]"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                }}
              >
                <span className="absolute inset-0 origin-left scale-x-0 bg-[#00004D] transition-transform duration-300 group-hover:scale-x-100" />

                <span className="relative z-10 whitespace-nowrap">
                  Explore Our Academics
                </span>

                <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                  <ArrowUpRight
                    size={15}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </motion.div>

            {/* Motto Card */}

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
              <div
                className="relative overflow-hidden rounded-[2rem] p-7 sm:p-9"
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
                    <GraduationCap size={23} />
                  </div>

                  <p
                    className="mt-7 text-[10px] font-bold uppercase tracking-[0.22em]"
                    style={{
                      color: SCHOOL_GOLD,
                    }}
                  >
                    Our Motto
                  </p>

                  <h3 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">
                    Concretising Faith Through Knowledge Acquisition
                  </h3>

                  <p className="mt-5 text-sm leading-7 text-white/65">
                    Our motto reflects our commitment to making faith practical
                    through knowledge, education, discipline and responsible
                    action.
                  </p>

                  <div className="mt-7 h-px bg-white/10" />

                  <p className="mt-5 text-xs font-medium leading-6 text-white/50">
                    Knowledge should strengthen faith, shape character and
                    inspire beneficial action.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          VISION & MISSION
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
            className="mx-auto max-w-2xl text-center"
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{
                color: SCHOOL_GOLD,
              }}
            >
              Our Direction
            </p>

            <h2
              className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              Guided by a clear purpose.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              Our vision and mission guide the way we educate, nurture and
              prepare our students for the future.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {/* Vision */}

            <motion.article
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
              }}
              className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_8px_30px_rgba(1,0,102,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#010066]/20 hover:shadow-[0_18px_45px_rgba(1,0,102,0.09)] sm:p-9"
            >
              <div
                className="absolute right-0 top-0 h-32 w-32 rounded-bl-full opacity-50 transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}06`,
                }}
              />

              <div className="relative z-10">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${SCHOOL_BLUE}08`,
                    color: SCHOOL_BLUE,
                  }}
                >
                  <Eye size={22} />
                </div>

                <p
                  className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{
                    color: SCHOOL_GOLD,
                  }}
                >
                  Our Vision
                </p>

                <h3
                  className="mt-3 text-2xl font-bold tracking-[-0.025em]"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                    // textAlign: justify,
                  }}
                >
                  To become a leading islamic school in the Nation (In Shaa Allah) which shall uphold; 
                  the Qur&apos;an and Sunnah of the holy Prophet Muhammad
                  in accordance with the understanding of the Salaf.
                </h3>

                {/* <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                  To become a leading Islamic educational institution that
                  develops knowledgeable, principled, confident and
                  responsible individuals who contribute positively to the
                  advancement of society.
                </p> */}
              </div>
            </motion.article>

            {/* Mission */}

            <motion.article
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
                delay: 0.08,
              }}
              className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_8px_30px_rgba(1,0,102,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#010066]/20 hover:shadow-[0_18px_45px_rgba(1,0,102,0.09)] sm:p-9"
            >
              <div
                className="absolute right-0 top-0 h-32 w-32 rounded-bl-full opacity-50 transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundColor: `${SCHOOL_GOLD}08`,
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
                  <Target size={22} />
                </div>

                <p
                  className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{
                    color: SCHOOL_GOLD,
                  }}
                >
                  Our Mission
                </p>

                <h3
                  className="mt-3 text-2xl font-bold tracking-[-0.025em]"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  Education that transforms lives.
                </h3>

                <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                  To provide quality and holistic education that combines
                  sound Islamic upbringing, academic excellence, character
                  development and practical skills, preparing learners to
                  become responsible and productive members of society.
                </p>
              </div>
            </motion.article>
          </div>
        </div>
      </section>

      {/* =====================================================
          CORE VALUES
      ====================================================== */}

      <section className="bg-white py-20 sm:py-24 lg:py-28">
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
              What We Stand For
            </p>

            <h2
              className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              Our core values.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              These principles influence how we teach, how we relate with one
              another and how we prepare students for life beyond school.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => {
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
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#010066]/20 hover:shadow-[0_18px_45px_rgba(1,0,102,0.09)]"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundColor: `${SCHOOL_BLUE}08`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    <Icon size={21} />
                  </div>

                  <h3
                    className="mt-6 text-lg font-bold"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    {value.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {value.description}
                  </p>
                </motion.article>
              );
            })}
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
              className="absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl"
              style={{
                backgroundColor: `${SCHOOL_GOLD}18`,
              }}
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full blur-3xl"
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
                Begin the Journey
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
                Give your child an education built on faith and knowledge.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
                Discover the learning environment, values and opportunities
                available at MSSN Al-Irshad Islamic School.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/admissions"
                  className="group relative inline-flex min-h-12.5 items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(255,175,46,0.30)]"
                  style={{
                    backgroundColor: SCHOOL_GOLD,
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />

                  <span className="relative z-10 whitespace-nowrap">
                    Start Your Admission
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
                  className="group relative inline-flex min-h-12.5 items-center justify-center gap-2 overflow-hidden rounded-full border border-white/30 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white hover:text-[#010066]"
                >
                  <span className="relative z-10 whitespace-nowrap">
                    Contact the School
                  </span>

                  <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-colors duration-300 group-hover:bg-[#010066]/10">
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
"use client";

import Image from "next/image";
import {
  ArrowUpRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
} from "@/config/site";

type GalleryItem = {
  id: number;
  title: string;
  category: string;
  image: string;
};

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: "School Community",
    category: "School Life",
    image: "/images/gallery/gallery-1.jpg",
  },
  {
    id: 2,
    title: "Learning & Development",
    category: "Academics",
    image: "/images/gallery/gallery-2.jpg",
  },
  {
    id: 3,
    title: "Students in Action",
    category: "Students",
    image: "/images/gallery/gallery-3.jpg",
  },
  {
    id: 4,
    title: "Islamic Activities",
    category: "Islamic",
    image: "/images/gallery/gallery-4.jpg",
  },
  {
    id: 5,
    title: "School Activities",
    category: "Events",
    image: "/images/gallery/gallery-5.jpg",
  },
  {
    id: 6,
    title: "Our Learning Environment",
    category: "School Life",
    image: "/images/gallery/gallery-6.jpg",
  },
  {
    id: 7,
    title: "Academic Excellence",
    category: "Academics",
    image: "/images/gallery/gallery-7.jpg",
  },
  {
    id: 8,
    title: "Student Experience",
    category: "Students",
    image: "/images/gallery/gallery-8.jpg",
  },
  {
    id: 9,
    title: "Community Moments",
    category: "Events",
    image: "/images/gallery/gallery-9.jpg",
  },
];

const categories = [
  "All",
  "School Life",
  "Academics",
  "Students",
  "Islamic",
  "Events",
];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const filteredItems =
    activeCategory === "All"
      ? galleryItems
      : galleryItems.filter(
          (item) => item.category === activeCategory,
        );

  const selectedItem =
    selectedIndex !== null ? filteredItems[selectedIndex] : null;

  const openGallery = (index: number) => {
    setSelectedIndex(index);
  };

  const closeGallery = () => {
    setSelectedIndex(null);
  };

  const showPrevious = () => {
    if (selectedIndex === null) return;

    setSelectedIndex(
      selectedIndex === 0
        ? filteredItems.length - 1
        : selectedIndex - 1,
    );
  };

  const showNext = () => {
    if (selectedIndex === null) return;

    setSelectedIndex(
      selectedIndex === filteredItems.length - 1
        ? 0
        : selectedIndex + 1,
    );
  };

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
            className="max-w-4xl"
          >
            {/* Eyebrow */}

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur-sm">
              <Camera
                size={14}
                style={{
                  color: SCHOOL_GOLD,
                }}
              />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                Picture Gallery
              </span>
            </div>

            {/* Heading */}

            <h1 className="max-w-4xl text-4xl font-bold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Moments that tell our{" "}
              <span
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                story.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
              Explore moments from school life, academic activities, Islamic
              programmes, student experiences and events at MSSN Al-Irshad
              Islamic School.
            </p>

            {/* Button */}

            <div className="mt-8">
              <a
                href="#gallery"
                className="group relative inline-flex min-h-[50px] items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(255,175,46,0.30)]"
                style={{
                  backgroundColor: SCHOOL_GOLD,
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />

                <span className="relative z-10 whitespace-nowrap">
                  Explore Gallery
                </span>

                <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
                  <ArrowUpRight
                    size={15}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
              </a>
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
          GALLERY
      ====================================================== */}

      <section
        id="gallery"
        className="scroll-mt-24 bg-white py-20 sm:py-24 lg:py-28"
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
            className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"
          >
            <div className="max-w-2xl">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                School Gallery
              </p>

              <h2
                className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Life at Al-Irshad, captured.
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                A visual collection of the people, activities and experiences
                that make our school community special.
              </p>
            </div>
          </motion.div>

          {/* =================================================
              CATEGORY FILTER
          ================================================== */}

          <div className="mt-10 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-2">
              {categories.map((category) => {
                const active = activeCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category);
                      setSelectedIndex(null);
                    }}
                    className="relative overflow-hidden rounded-full border px-5 py-2.5 text-xs font-bold transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: active
                        ? SCHOOL_BLUE
                        : "#ffffff",
                      borderColor: active
                        ? SCHOOL_BLUE
                        : "#e2e8f0",
                      color: active
                        ? "#ffffff"
                        : "#475569",
                      boxShadow: active
                        ? `0 8px 22px ${SCHOOL_BLUE}20`
                        : "none",
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =================================================
              PHOTO GRID
          ================================================== */}

          <motion.div
            layout
            className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  type="button"
                  layout
                  initial={{
                    opacity: 0,
                    y: 25,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.96,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.04,
                  }}
                  onClick={() => openGallery(index)}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100 text-left shadow-[0_8px_30px_rgba(1,0,102,0.04)] outline-none transition-all duration-300 hover:-translate-y-1 hover:border-[#010066]/20 hover:shadow-[0_20px_50px_rgba(1,0,102,0.12)] focus-visible:ring-2 focus-visible:ring-[#FFAF2E]"
                >
                  {/* Image */}

                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Dark hover overlay */}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#00004D]/80 via-[#00004D]/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />

                    {/* Category */}

                    <span
                      className="absolute left-4 top-4 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        backgroundColor: `${SCHOOL_GOLD}E8`,
                        color: SCHOOL_BLUE_DARK,
                      }}
                    >
                      {item.category}
                    </span>

                    {/* Open icon */}

                    <span className="absolute right-4 top-4 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/90 text-[#010066] opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <ArrowUpRight size={15} />
                    </span>

                    {/* Bottom content */}

                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <h3 className="text-lg font-bold text-white">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs font-medium text-white/60">
                        View photograph
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty state */}

          {filteredItems.length === 0 && (
            <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <Camera
                className="mx-auto text-slate-300"
                size={32}
              />

              <h3
                className="mt-4 text-lg font-bold"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                No photographs available yet.
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                More school moments will be added to this category soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          GALLERY CTA
      ====================================================== */}

      <section className="bg-slate-50 pb-20 sm:pb-24 lg:pb-28">
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
                More to Discover
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
                See more of life at MSSN Al-Irshad.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
                Discover our students, staff, academic environment and school
                community.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a
                  href="/student-life"
                  className="group relative inline-flex min-h-[50px] items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(255,175,46,0.30)]"
                  style={{
                    backgroundColor: SCHOOL_GOLD,
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />

                  <span className="relative z-10 whitespace-nowrap">
                    Student Life
                  </span>

                  <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
                    <ArrowUpRight
                      size={15}
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </a>

                <a
                  href="/news-events"
                  className="group relative inline-flex min-h-[50px] items-center justify-center gap-2 overflow-hidden rounded-full border border-white/30 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white hover:text-[#010066]"
                >
                  <span className="relative z-10 whitespace-nowrap">
                    News & Events
                  </span>

                  <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-colors duration-300 group-hover:bg-[#010066]/10">
                    <ArrowUpRight
                      size={15}
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================
          LIGHTBOX
      ====================================================== */}

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#00001f]/95 p-4 backdrop-blur-md sm:p-8"
            onClick={closeGallery}
          >
            {/* Close */}

            <button
              type="button"
              aria-label="Close gallery"
              onClick={closeGallery}
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all duration-300 hover:rotate-90 hover:bg-white/20 sm:right-7 sm:top-7"
            >
              <X size={21} />
            </button>

            {/* Previous */}

            <button
              type="button"
              aria-label="Previous image"
              onClick={(event) => {
                event.stopPropagation();
                showPrevious();
              }}
              className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all duration-300 hover:scale-105 hover:bg-white/20 sm:left-7"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Next */}

            <button
              type="button"
              aria-label="Next image"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
              className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all duration-300 hover:scale-105 hover:bg-white/20 sm:right-7"
            >
              <ChevronRight size={22} />
            </button>

            {/* Image container */}

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              transition={{
                duration: 0.3,
              }}
              className="relative w-full max-w-5xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-900 shadow-2xl sm:rounded-3xl">
                <Image
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  fill
                  sizes="95vw"
                  className="object-contain"
                  priority
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 px-2">
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{
                      color: SCHOOL_GOLD,
                    }}
                  >
                    {selectedItem.category}
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">
                    {selectedItem.title}
                  </h3>
                </div>

                <p className="shrink-0 text-xs font-medium text-white/40">
                  {selectedIndex !== null
                    ? `${selectedIndex + 1} / ${filteredItems.length}`
                    : ""}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EmblaCarouselType } from "embla-carousel";
import EmblaCarousel from "embla-carousel";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type Slide = {
  src: string;
  alt: string;
  ctaLabel: string;
  ctaHref: string;
};

const slides: Slide[] = [
  {
    src: "/images/banner_1.png",
    alt: "Học sinh đang học trên EduClass",
    ctaLabel: "Khám phá ngay",
    ctaHref: ROUTES.REGISTER,
  },
  {
    src: "/images/banner_2.png",
    alt: "Giáo viên đang thiết kế khóa học trên EduClass",
    ctaLabel: "Đăng ký dạy thử",
    ctaHref: ROUTES.LOGIN,
  },
];

const AUTOPLAY_MS = 6000;

export default function HeroCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [embla, setEmbla] = useState<EmblaCarouselType | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!viewportRef.current) return;

    const instance = EmblaCarousel(viewportRef.current, {
      loop: true,
      skipSnaps: true,
      align: "start",
    });
    setEmbla(instance);

    const onSelect = () => {
      setSelectedIndex(instance.selectedScrollSnap());
      setCanScrollPrev(instance.canScrollPrev());
      setCanScrollNext(instance.canScrollNext());
    };
    instance.on("select", onSelect);
    instance.on("reInit", onSelect);
    onSelect();

    return () => instance.destroy();
  }, []);

  const startAutoplay = useCallback(() => {
    if (!embla || prefersReducedMotion) return;
    autoplayRef.current = setInterval(() => embla.scrollNext(), AUTOPLAY_MS);
  }, [embla, prefersReducedMotion]);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    startAutoplay();

    const viewport = viewportRef.current;
    const onVisibility = () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    };
    const onEnter = () => stopAutoplay();
    const onLeave = () => startAutoplay();

    document.addEventListener("visibilitychange", onVisibility);
    viewport?.addEventListener("mouseenter", onEnter);
    viewport?.addEventListener("mouseleave", onLeave);
    viewport?.addEventListener("focusin", onEnter);
    viewport?.addEventListener("focusout", onLeave);

    return () => {
      stopAutoplay();
      document.removeEventListener("visibilitychange", onVisibility);
      viewport?.removeEventListener("mouseenter", onEnter);
      viewport?.removeEventListener("mouseleave", onLeave);
      viewport?.removeEventListener("focusin", onEnter);
      viewport?.removeEventListener("focusout", onLeave);
    };
  }, [startAutoplay, stopAutoplay, prefersReducedMotion]);

  const scrollPrev = () => embla?.scrollPrev();
  const scrollNext = () => embla?.scrollNext();
  const scrollTo = (index: number) => embla?.scrollTo(index);

  return (
    <section className="w-full">
      <div
        ref={viewportRef}
        className="embla relative h-[26.5rem] sm:h-[30.5rem] md:h-[34.5rem] lg:h-[38.5rem] w-full select-none overflow-hidden rounded-xl sm:rounded-2xl"
      >
        <div className="embla__container flex h-full">
          {slides.map((slide, index) => (
            <div
              key={slide.src}
              className="embla__slide relative h-full flex-[0_0_100%] min-w-full"
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
              {/* CTA button — bottom-left overlay; banner art already carries the copy */}
              <Link
                href={slide.ctaHref}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "font-semibold absolute bottom-8 left-4 z-10 sm:bottom-10 sm:left-8 md:bottom-12 md:left-10",
                )}
              >
                {slide.ctaLabel}
              </Link>
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        <div className="absolute inset-0 z-20 flex items-center justify-between px-3 sm:px-4">
          <button
            type="button"
            aria-label="Previous slide"
            disabled={!canScrollPrev}
            onClick={scrollPrev}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            disabled={!canScrollNext}
            onClick={scrollNext}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Dot pagination */}
        <div
          aria-label="Pagination"
          className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center gap-1.5 sm:gap-2"
        >
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === selectedIndex}
              aria-pressed={index === selectedIndex}
              onClick={() => scrollTo(index)}
              className={cn(
                "rounded-full bg-white/30 transition-all hover:bg-white/50",
                index === selectedIndex
                  ? "h-1.5 w-6 sm:w-8 bg-primary shadow-[0_0_0_2px_#fff]"
                  : "h-1.5 w-6",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

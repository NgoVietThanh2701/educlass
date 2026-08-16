"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import EmblaCarousel from "embla-carousel";

interface UseEmblaCarouselOptions {
  /** (Re)init once this is true AND the viewport element is mounted. */
  enabled?: boolean;
  /** Embla options evaluated when (re)initializing. */
  options?: EmblaOptionsType;
  /** Change to force a re-init — e.g. pass the number of slides rendered. */
  slidesVersion?: unknown;
}

/**
 * Shared Embla carousel lifecycle hook, used by both the home hero and the
 * featured-courses slider so the drag/snap + arrows logic isn't duplicated.
 * It (re)initializes whenever `enabled` flips true or `slidesVersion` changes,
 * tracks scroll state, and exposes positional scroll helpers.
 */
export function useEmblaCarousel({
  enabled = true,
  options,
  slidesVersion,
}: UseEmblaCarouselOptions = {}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<EmblaOptionsType | undefined>(options);

  const [embla, setEmbla] = useState<EmblaCarouselType | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    const instance = EmblaCarousel(viewport, optionsRef.current);
    setEmbla(instance);

    const onSelect = () => {
      setSelectedIndex(instance.selectedScrollSnap());
      setCanScrollPrev(instance.canScrollPrev());
      setCanScrollNext(instance.canScrollNext());
    };
    instance.on("select", onSelect);
    instance.on("reInit", onSelect);
    onSelect();

    return () => {
      instance.destroy();
      setEmbla(null);
      setSelectedIndex(0);
      setCanScrollPrev(false);
      setCanScrollNext(false);
    };
  }, [enabled, slidesVersion]);

  const scrollPrev = useCallback(() => embla?.scrollPrev(), [embla]);
  const scrollNext = useCallback(() => embla?.scrollNext(), [embla]);
  const scrollTo = useCallback(
    (index: number) => embla?.scrollTo(index),
    [embla],
  );

  return {
    viewportRef,
    embla,
    selectedIndex,
    canScrollPrev,
    canScrollNext,
    scrollPrev,
    scrollNext,
    scrollTo,
  };
}

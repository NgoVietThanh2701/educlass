import type { HTMLMotionProps, Transition } from "framer-motion";

export const motionTransition: Transition = {
  duration: 0.2,
  ease: "easeOut",
};

export const fadeSlideMotion = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: motionTransition,
} satisfies HTMLMotionProps<"nav">;

export const collapseMotion = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: motionTransition,
} satisfies HTMLMotionProps<"div">;

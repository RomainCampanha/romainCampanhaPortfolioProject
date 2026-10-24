"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

// Providers client globaux. reducedMotion="user" : Motion respecte prefers-reduced-motion.
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

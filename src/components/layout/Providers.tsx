"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { SmoothScroll } from "./SmoothScroll";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <ToastProvider>{children}</ToastProvider>
      </SmoothScroll>
    </MotionConfig>
  );
}

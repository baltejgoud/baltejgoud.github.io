"use client";

import { useSyncExternalStore } from "react";
import { hyderabadTime } from "@/lib/time";

const subscribe = (onChange: () => void) => {
  const id = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(id);
};
const getSnapshot = () => hyderabadTime(new Date());
const getServerSnapshot = () => "";

export function LocalTime() {
  return <span>{useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)}</span>;
}

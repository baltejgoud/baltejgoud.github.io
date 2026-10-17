"use client";

import { createContext, useContext } from "react";

export interface SiteApi {
  /** Shows a short status message above the dock. */
  toast: (message: string) => void;
  openMusic: () => void;
  /** Scrolls to the journey and opens a stop. */
  goToStop: (index: number) => void;
  dark: boolean;
}

export const SiteContext = createContext<SiteApi | null>(null);

export function useSite(): SiteApi {
  const api = useContext(SiteContext);
  if (!api) throw new Error("useSite must be used inside <Portfolio>");
  return api;
}

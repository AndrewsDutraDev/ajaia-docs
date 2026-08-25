"use client";

import { useEffect } from "react";

/** Fires the browser's print dialog shortly after mount — the user picks "Save as PDF" there. */
export default function PrintTrigger() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 250);
    return () => clearTimeout(timer);
  }, []);

  return null;
}

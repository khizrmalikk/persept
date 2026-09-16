"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// v1 keeps it simple: re-render server components every few seconds. Supabase Realtime can
// replace this later without touching the pages.
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}

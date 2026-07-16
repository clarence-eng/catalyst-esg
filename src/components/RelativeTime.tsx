"use client";
import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/lib/utils";

export function RelativeTime({ date }: { date: Date }) {
  const [label, setLabel] = useState(() => `Generated ${formatRelativeTime(date)}`);
  useEffect(() => {
    setLabel(`Generated ${formatRelativeTime(date)}`);
    const id = setInterval(() => setLabel(`Generated ${formatRelativeTime(date)}`), 60_000);
    return () => clearInterval(id);
  }, [date]);
  return <>{label}</>;
}

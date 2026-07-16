"use client";
import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/lib/utils";

export function RelativeTime({ date }: { date: Date }) {
  // Use the numeric timestamp as the effect dependency — Date object references change on
  // every parent render (new Date()), which would destroy and restart the interval before
  // it ever fires, preventing the label from self-updating.
  const ts = date.getTime();
  const [label, setLabel] = useState(() => `Generated ${formatRelativeTime(new Date(ts))}`);
  useEffect(() => {
    setLabel(`Generated ${formatRelativeTime(new Date(ts))}`);
    const id = setInterval(() => setLabel(`Generated ${formatRelativeTime(new Date(ts))}`), 60_000);
    return () => clearInterval(id);
  }, [ts]);
  return <>{label}</>;
}

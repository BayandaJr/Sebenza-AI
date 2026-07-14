import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated] as const;
}

export type Metrics = {
  tasksCompleted: number;
  emailsGenerated: number;
  meetingsSummarized: number;
  researchProcessed: number;
  hoursSaved: number;
  productivityScore: number;
};

export const defaultMetrics: Metrics = {
  tasksCompleted: 47,
  emailsGenerated: 23,
  meetingsSummarized: 8,
  researchProcessed: 14,
  hoursSaved: 6.5,
  productivityScore: 92,
};

export function bumpMetric(key: keyof Metrics, by = 1) {
  try {
    const raw = window.localStorage.getItem("metrics");
    const cur = raw ? (JSON.parse(raw) as Metrics) : defaultMetrics;
    const next = { ...cur, [key]: (cur[key] as number) + by };
    // recompute productivity score
    next.productivityScore = Math.min(
      99,
      70 + Math.round((next.emailsGenerated + next.meetingsSummarized + next.tasksCompleted) / 5),
    );
    window.localStorage.setItem("metrics", JSON.stringify(next));
    window.dispatchEvent(new Event("metrics-updated"));
  } catch {
    /* ignore */
  }
}

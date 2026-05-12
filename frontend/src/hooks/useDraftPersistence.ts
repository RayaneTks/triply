'use client';

import { useState } from "react";
import { ActiveTrip } from "../types/app";

export function useDraftPersistence() {
  const [draft, setDraft] = useState<Partial<ActiveTrip> | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('triply_draft');
      return saved ? (JSON.parse(saved) as Partial<ActiveTrip>) : null;
    } catch {
      return null;
    }
  });

  const persist = (data: Partial<ActiveTrip>) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("triply_draft", JSON.stringify(data));
    }
    setDraft(data);
  };

  return { draft, persist };
}

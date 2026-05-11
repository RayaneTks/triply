'use client';

import { useState, useEffect } from "react";
import { ActiveTrip } from "../types/app";

/**
 * Hook pour la persistance locale du brouillon en cours.
 */
export function useDraftPersistence() {
  const [draft, setDraft] = useState<Partial<ActiveTrip> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("triply_draft");
      if (saved) setDraft(JSON.parse(saved));
    } catch {
      // ignore corrupted draft
    }
  }, []);

  const persist = (data: Partial<ActiveTrip>) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("triply_draft", JSON.stringify(data));
    }
    setDraft(data);
  };

  return { draft, persist };
}

import { useState, useEffect } from "react";
import { ActiveTrip } from "../types/app";

/**
 * Hook pour la persistance locale du brouillon en cours.
 * // TODO: align with real ActiveTrip schema.
 */
export function useDraftPersistence() {
  const [draft, setDraft] = useState<Partial<ActiveTrip> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("triply_draft");
    if (saved) setDraft(JSON.parse(saved));
  }, []);

  const persist = (data: Partial<ActiveTrip>) => {
    localStorage.setItem("triply_draft", JSON.stringify(data));
    setDraft(data);
  };

  return { draft, persist };
}

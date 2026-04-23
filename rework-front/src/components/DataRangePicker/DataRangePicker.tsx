import React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

export function DataRangePicker() {
  return (
    <div className="p-12 triply-card flex flex-col items-center justify-center gap-4 text-light-muted">
       <CalendarIcon size={32} />
       <p className="text-xs font-bold uppercase tracking-widest leading-relaxed text-center">
         DateRangePicker Shell <br/>
         <span className="text-[10px]">TODO: Intégrer react-day-picker ou équivalent</span>
       </p>
    </div>
  );
}

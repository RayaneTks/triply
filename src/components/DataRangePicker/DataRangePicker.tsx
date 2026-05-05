import React from "react";
import { CalendarRange } from "lucide-react";
import { formatTripDateRange } from "../../lib/format-trip-dates";

export type DataRangePickerProps = {
  startDate: string;
  endDate: string;
  onChange: (next: { startDate: string; endDate: string }) => void;
  flexible?: boolean;
  onFlexibleChange?: (flexible: boolean) => void;
};

export function DataRangePicker({
  startDate,
  endDate,
  onChange,
  flexible = false,
  onFlexibleChange,
}: DataRangePickerProps) {
  const summary = formatTripDateRange(startDate || undefined, endDate || undefined);

  return (
    <div className="space-y-6">
      <div className="triply-card p-6 lg:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <CalendarRange size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-light-muted mb-1">
              Période
            </p>
            <p className="text-lg font-bold leading-snug">{summary}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-2 block text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-light-muted">
              Départ
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const v = e.target.value;
                onChange({ startDate: v, endDate: endDate < v ? v : endDate });
              }}
              className="w-full bg-light-bg border border-light-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
          <label className="space-y-2 block text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-light-muted">
              Retour
            </span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => onChange({ startDate, endDate: e.target.value })}
              className="w-full bg-light-bg border border-light-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
        </div>
      </div>

      {onFlexibleChange && (
        <label className="flex items-center gap-3 p-4 bg-white border border-light-border rounded-xl cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 accent-brand shrink-0"
            checked={flexible}
            onChange={(e) => onFlexibleChange(e.target.checked)}
          />
          <span className="text-sm font-bold">Dates flexibles (+/- 3 jours)</span>
        </label>
      )}
    </div>
  );
}

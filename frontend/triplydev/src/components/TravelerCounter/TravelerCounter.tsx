import React from "react";
import { Plus, Minus, User } from "lucide-react";

export function TravelerCounter({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-6 p-4 bg-white border border-light-border rounded-xl w-fit">
      <div className="flex items-center gap-3">
        <User size={18} className="text-light-muted" />
        <span className="text-sm font-bold">Voyageurs</span>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-8 h-8 rounded-lg bg-light-bg flex items-center justify-center hover:bg-light-border transition-colors"
        >
          <Minus size={14} />
        </button>
        <span className="font-display font-bold text-xl min-w-[20px] text-center">{value}</span>
        <button 
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center hover:bg-brand-hover transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

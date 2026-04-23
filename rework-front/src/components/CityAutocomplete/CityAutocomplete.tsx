import React from "react";
import { Search } from "lucide-react";

export function CityAutocomplete({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const MOCK_CITIES = ["Rome, Italie", "Paris, France", "Londres, Royaume-Uni", "Berlin, Allemagne", "Tokyo, Japon"];

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-light-muted" size={18} />
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Où souhaitez-vous décoller ?"
        className="w-full bg-white border border-light-border rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand"
      />
      {value && value.length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-light-border rounded-xl shadow-xl z-50 overflow-hidden">
          {MOCK_CITIES.filter(c => c.toLowerCase().includes(value.toLowerCase())).map(city => (
            <button 
              key={city}
              onClick={() => onChange(city)}
              className="w-full text-left px-6 py-4 hover:bg-light-bg text-sm font-bold transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

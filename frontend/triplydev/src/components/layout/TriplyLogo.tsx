import React from "react";
import { Compass } from "lucide-react";
import { cn } from "../../lib/utils";

export function TriplyLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 group cursor-pointer", className)}>
      <div className="bg-brand w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm shadow-brand/20 transition-transform group-hover:scale-110">
        <Compass size={20} />
      </div>
      <span className="font-display text-xl font-bold text-light-foreground">
        Triply
      </span>
    </div>
  );
}

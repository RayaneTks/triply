import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-light-border rounded-[40px] bg-white/50",
      className
    )}>
      <div className="w-20 h-20 bg-light-bg rounded-full flex items-center justify-center text-light-muted mb-6">
        <Icon size={40} />
      </div>
      <h3 className="text-xl font-bold text-light-foreground mb-2">{title}</h3>
      <p className="text-light-muted max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

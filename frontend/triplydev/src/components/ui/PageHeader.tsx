import React from "react";
import { cn } from "../../lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8", className)}>
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-light-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-light-muted text-lg max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

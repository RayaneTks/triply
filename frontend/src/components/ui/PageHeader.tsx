'use client';

import React from "react";
import { cn } from "../../lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  // Toujours stack vertical : titre pleine largeur, actions sur une ligne au-dessous
  // qui peuvent wrapper librement. Évite l'effet "colonne de lettres" quand les
  // actions monopolisent l'espace horizontal.
  return (
    <div className={cn("mb-8 flex flex-col gap-5", className)}>
      <div className="min-w-0 space-y-2">
        <h1 className="text-balance font-display text-3xl font-bold leading-tight text-light-foreground md:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-light-muted text-base lg:text-lg leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

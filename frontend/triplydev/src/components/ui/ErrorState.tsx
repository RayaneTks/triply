import React from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

type ErrorStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  primaryAction?: { label: string; to: string };
  secondaryAction?: { label: string; to: string };
};

export function ErrorState({
  title,
  description,
  icon: Icon = AlertTriangle,
  primaryAction,
  secondaryAction,
}: ErrorStateProps) {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
        <Icon size={32} strokeWidth={2} />
      </div>
      <h1 className="text-2xl font-display font-bold mb-3">{title}</h1>
      <p className="text-light-muted font-bold text-sm leading-relaxed mb-10">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {primaryAction && (
          <Link to={primaryAction.to} className="btn-primary py-3 px-6 text-sm inline-flex justify-center">
            {primaryAction.label}
          </Link>
        )}
        {secondaryAction && (
          <Link
            to={secondaryAction.to}
            className="btn-secondary py-3 px-6 text-sm inline-flex justify-center"
          >
            {secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}

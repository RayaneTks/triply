'use client';

import { ThemeToggle } from '../ThemeToggle/ThemeToggle';

export function FloatingThemeToggle() {
  return (
    <div className="fixed right-4 top-4 z-[60] sm:right-6 sm:top-6">
      <ThemeToggle />
    </div>
  );
}

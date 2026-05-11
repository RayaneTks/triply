import React from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';

interface TriplyLogoProps {
  className?: string;
  /** Hauteur en pixels du logo affiché. */
  size?: number;
  priority?: boolean;
}

/**
 * Logo Triply adaptatif au thème.
 *
 * Le composant rend les deux images (light & dark) en parallèle ; CSS gère
 * l'affichage en fonction de `data-theme` sur `<html>`. Cela évite tout flash
 * lors du switch dark/light et fonctionne sans JS / sans re-render React.
 */
export function TriplyLogo({ className, size = 52, priority = false }: TriplyLogoProps) {
  // Ratio approximatif du logo (largeur ≈ 3.3x hauteur pour ces PNGs)
  const width = Math.round(size * 3.4);

  return (
    <span
      className={cn(
        'inline-flex items-center transition-opacity duration-200 group-hover:opacity-90',
        className,
      )}
      style={{ height: size }}
      aria-label="Triply"
    >
      <Image
        src="/Logo-triply-dark.png"
        alt=""
        width={width}
        height={size}
        priority={priority}
        className="triply-logo-dark h-full w-auto object-contain"
      />
      <Image
        src="/Logo-triply-light.png"
        alt=""
        width={width}
        height={size}
        priority={priority}
        className="triply-logo-light h-full w-auto object-contain"
      />
    </span>
  );
}

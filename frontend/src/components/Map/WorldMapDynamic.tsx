'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { MapProps } from './Map';

const Fallback = () => (
  <div
    aria-hidden="true"
    className="h-full w-full animate-pulse bg-gradient-to-br from-secondary/30 via-background to-background"
  />
);

export const WorldMap: ComponentType<MapProps> = dynamic(
  () => import('./Map').then((m) => m.WorldMap),
  {
    ssr: false,
    loading: Fallback,
  },
);

export type { MapProps, MapboxPoiFeature, RouteMapSegment } from './Map';

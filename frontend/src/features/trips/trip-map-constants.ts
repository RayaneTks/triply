export const DAY_PALETTE = [
    '#06b6d4',
    '#f97316',
    '#8b5cf6',
    '#22c55e',
    '#ec4899',
    '#facc15',
    '#0ea5e9',
    '#f43f5e',
] as const;

export const ORIGIN_COLOR = '#0f172a';

export function dayColor(dayIndex: number): string {
    return DAY_PALETTE[(dayIndex - 1 + DAY_PALETTE.length) % DAY_PALETTE.length];
}

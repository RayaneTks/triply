<?php

namespace App\Services\Contracts;

use App\Models\Voyage;

/**
 * Reads and writes the plan_snapshot ↔ normalized DB structure.
 *
 * Trip snapshots (frontend wizard output) are denormalized JSON blobs;
 * persisted trip data lives in voyages + transports + hebergements +
 * journees/etapes tables. This service bridges the two representations.
 */
interface SnapshotSyncServiceInterface
{
    /**
     * Sync a plan_snapshot into structured DB rows (clears + recreates).
     *
     * @param array<string, mixed> $snapshot
     */
    public function syncFromSnapshot(Voyage $voyage, array $snapshot): void;

    /**
     * Remove all structured children (transports, hebergements, journees).
     * Etapes cascade-delete with their journee.
     */
    public function clearStructured(Voyage $voyage): void;

    /**
     * Deep-copy structured children from source to copy.
     */
    public function duplicateStructured(Voyage $source, Voyage $copy): void;

    /**
     * Strip a snapshot down to fields that should survive in plan_snapshot
     * (everything else is recoverable from structured tables).
     *
     * @return array<string, mixed>|null
     */
    public function compactForStorage(mixed $snapshot): ?array;

    /**
     * Rebuild the full snapshot shape from structured tables.
     *
     * @return array<string, mixed>
     */
    public function buildFromStructured(Voyage $voyage): array;

    /**
     * Compute total trip budget (EUR) from snapshot flight + hotel pricing.
     */
    public function extractBudgetTotal(mixed $snapshot): int;

    /**
     * Pick a sensible destination string from snapshot's destinationSummary
     * or hotelSummary, falling back to provided default.
     */
    public function resolveDestination(string $fallback, mixed $snapshot): string;
}

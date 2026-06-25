<?php

namespace App\Services\Contracts;

use App\Models\Voyage;

/**
 * Sélectionne automatiquement le vol et l'hôtel les moins chers répondant aux
 * besoins déclarés au wizard (`plan_snapshot.plannerNeeds`). Best-effort :
 * les erreurs réseau ou Amadeus sont avalées et journalisées, jamais propagées
 * — la création du voyage doit toujours réussir.
 */
interface TripAutoSelectionServiceInterface
{
    /**
     * Lance la sélection automatique pour un voyage tout juste créé.
     * Met à jour le voyage en place (transports / hebergements / plan_snapshot).
     */
    public function runForTrip(Voyage $voyage): void;
}

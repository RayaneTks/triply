<?php

namespace App\Services\Geo;

interface CityCountryResolverInterface
{
    /**
     * Resoudre le nom du pays (en francais quand possible) a partir d'un nom de ville.
     *
     * Retourne null si la ville est vide ou si aucun pays n'a pu etre resolu de maniere
     * fiable (et que l'on ne veut pas polluer la BDD avec une devinette).
     */
    public function resolve(?string $city): ?string;
}

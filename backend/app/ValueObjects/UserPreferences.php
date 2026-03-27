<?php

namespace App\ValueObjects;

use Illuminate\Contracts\Database\Eloquent\Castable;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class UserPreferences implements Castable
{
    public function __construct(
        public array $environments = [],
        public ?string $planning_mode = null,
        public ?string $traveler_profile = null,
        public array $interests = [],
        public ?string $pace = null,
        public ?string $food_preference = null,
        public array $diet = [],
        public ?bool $breakfast_included = null,
        public ?float $max_budget = null,
        public array $visited_cities = [],
    ) {}

    public function toArray(): array
    {
        return array_filter([
            'environments' => $this->environments,
            'planning_mode' => $this->planning_mode,
            'traveler_profile' => $this->traveler_profile,
            'interests' => $this->interests,
            'pace' => $this->pace,
            'food_preference' => $this->food_preference,
            'diet' => $this->diet,
            'breakfast_included' => $this->breakfast_included,
            'max_budget' => $this->max_budget,
            'visited_cities' => $this->visited_cities,
        ], fn ($value) => $value !== null && $value !== []);
    }

    public function merge(array $data): self
    {
        return new self(
            environments: $data['environments'] ?? $this->environments,
            planning_mode: $data['planning_mode'] ?? $this->planning_mode,
            traveler_profile: $data['traveler_profile'] ?? $this->traveler_profile,
            interests: $data['interests'] ?? $this->interests,
            pace: $data['pace'] ?? $this->pace,
            food_preference: $data['food_preference'] ?? $this->food_preference,
            diet: $data['diet'] ?? $this->diet,
            breakfast_included: $data['breakfast_included'] ?? $this->breakfast_included,
            max_budget: $data['max_budget'] ?? $this->max_budget,
            visited_cities: $data['visited_cities'] ?? $this->visited_cities,
        );
    }

    public function toPromptContext(): string
    {
        $parts = [];

        if ($this->environments) {
            $parts[] = 'Environnements préférés : ' . implode(', ', $this->environments);
        }
        if ($this->traveler_profile) {
            $parts[] = 'Profil voyageur : ' . $this->traveler_profile;
        }
        if ($this->interests) {
            $parts[] = 'Activités favorites : ' . implode(', ', $this->interests);
        }
        if ($this->pace) {
            $parts[] = 'Rythme : ' . $this->pace;
        }
        if ($this->food_preference) {
            $parts[] = 'Préférence culinaire : ' . $this->food_preference;
        }
        if ($this->diet) {
            $parts[] = 'Régime alimentaire : ' . implode(', ', $this->diet);
        }
        if ($this->max_budget !== null) {
            $parts[] = 'Budget max : ' . $this->max_budget . '€';
        }

        return implode("\n", $parts);
    }

    public static function castUsing(array $arguments): CastsAttributes
    {
        return new class implements CastsAttributes
        {
            public function get(Model $model, string $key, mixed $value, array $attributes): UserPreferences
            {
                $data = json_decode($value ?? '{}', true) ?: [];

                return new UserPreferences(
                    environments: $data['environments'] ?? [],
                    planning_mode: $data['planning_mode'] ?? null,
                    traveler_profile: $data['traveler_profile'] ?? null,
                    interests: $data['interests'] ?? [],
                    pace: $data['pace'] ?? null,
                    food_preference: $data['food_preference'] ?? null,
                    diet: $data['diet'] ?? [],
                    breakfast_included: $data['breakfast_included'] ?? null,
                    max_budget: $data['max_budget'] ?? null,
                    visited_cities: $data['visited_cities'] ?? [],
                );
            }

            public function set(Model $model, string $key, mixed $value, array $attributes): string
            {
                if ($value instanceof UserPreferences) {
                    return json_encode($value->toArray());
                }

                return json_encode($value);
            }
        };
    }
}

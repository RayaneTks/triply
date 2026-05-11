<?php

namespace Database\Factories;

use App\Models\Voyage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Journee>
 */
class JourneeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'date_jour' => fake()->dateTimeBetween('+1 week', '+2 months')->format('Y-m-d'),
            'numero_jour' => fake()->numberBetween(1, 14),
            'voyage_id' => Voyage::factory(),
        ];
    }

    public function forVoyage(Voyage $voyage, int $dayNumber = 1): static
    {
        $date = $voyage->date_debut->copy()->addDays($dayNumber - 1);

        return $this->state(fn (array $attributes) => [
            'voyage_id' => $voyage->id,
            'numero_jour' => $dayNumber,
            'date_jour' => $date->format('Y-m-d'),
        ]);
    }
}

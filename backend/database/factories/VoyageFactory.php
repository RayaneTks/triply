<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Voyage>
 */
class VoyageFactory extends Factory
{
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('+1 week', '+2 months');
        $end = (clone $start)->modify('+5 days');

        return [
            'titre' => 'Voyage à ' . fake()->city(),
            'destination' => fake()->city(),
            'date_debut' => $start->format('Y-m-d'),
            'date_fin' => $end->format('Y-m-d'),
            'budget_total' => fake()->numberBetween(500, 5000),
            'nb_voyageurs' => fake()->numberBetween(1, 6),
            'description' => fake()->optional()->paragraph(),
            'user_id' => User::factory(),
            'plan_snapshot' => null,
        ];
    }

    public function withSnapshot(array $snapshot): static
    {
        return $this->state(fn (array $attributes) => [
            'plan_snapshot' => $snapshot,
        ]);
    }
}

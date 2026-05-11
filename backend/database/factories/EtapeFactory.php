<?php

namespace Database\Factories;

use App\Models\Journee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Etape>
 */
class EtapeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'temps_estime' => fake()->randomElement(['1h', '2h', '3h', '1h30']),
            'titre' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            'prix_estime' => fake()->numberBetween(0, 200),
            'ville' => fake()->city(),
            'pays' => fake()->country(),
            'source_lien' => fake()->optional()->url(),
            'journee_id' => Journee::factory(),
            'ordre' => fake()->numberBetween(0, 10),
            'liked_state' => 'neutral',
        ];
    }

    public function liked(): static
    {
        return $this->state(fn (array $attributes) => [
            'liked_state' => 'liked',
        ]);
    }

    public function disliked(): static
    {
        return $this->state(fn (array $attributes) => [
            'liked_state' => 'disliked',
        ]);
    }
}

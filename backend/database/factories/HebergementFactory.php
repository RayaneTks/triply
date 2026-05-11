<?php

namespace Database\Factories;

use App\Models\Voyage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Hebergement>
 */
class HebergementFactory extends Factory
{
    public function definition(): array
    {
        $arrival = fake()->dateTimeBetween('+1 week', '+2 months');
        $departure = (clone $arrival)->modify('+3 days');

        return [
            'type' => fake()->randomElement(['hotel', 'airbnb', 'hostel', 'apartment']),
            'nom' => fake()->company(),
            'adresse' => fake()->streetAddress(),
            'code_postal' => fake()->postcode(),
            'ville' => fake()->city(),
            'latitude' => fake()->latitude(),
            'longitude' => fake()->longitude(),
            'arrivee_le' => $arrival->format('Y-m-d H:i:s'),
            'depart_le' => $departure->format('Y-m-d H:i:s'),
            'prix' => fake()->numberBetween(50, 500),
            'devise' => 'EUR',
            'informations_supplementaire' => fake()->optional()->sentence(),
            'voyage_id' => Voyage::factory(),
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Voyage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Transport>
 */
class TransportFactory extends Factory
{
    public function definition(): array
    {
        $departure = fake()->dateTimeBetween('+1 week', '+2 months');
        $arrival = (clone $departure)->modify('+3 hours');

        return [
            'type' => fake()->randomElement(['flight', 'train', 'bus', 'car']),
            'depart_lieu' => fake()->city(),
            'arrivee_lieu' => fake()->city(),
            'depart_le' => $departure->format('Y-m-d H:i:s'),
            'arrivee_le' => $arrival->format('Y-m-d H:i:s'),
            'prix' => fake()->numberBetween(50, 800),
            'devise' => 'EUR',
            'information_supplementaire' => fake()->optional()->sentence(),
            'voyage_id' => Voyage::factory(),
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Voyage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LocalTransport>
 */
class LocalTransportFactory extends Factory
{
    public function definition(): array
    {
        $departure = fake()->dateTimeBetween('+1 week', '+2 months');
        $arrival = (clone $departure)->modify('+45 minutes');

        return [
            'voyage_id' => Voyage::factory(),
            'type' => fake()->randomElement(['metro', 'bus', 'taxi', 'tram']),
            'from_label' => fake()->streetName(),
            'to_label' => fake()->streetName(),
            'departure_at' => $departure->format('Y-m-d H:i:s'),
            'arrival_at' => $arrival->format('Y-m-d H:i:s'),
            'price' => fake()->randomFloat(2, 1, 50),
            'currency' => 'EUR',
            'notes' => fake()->optional()->sentence(),
        ];
    }
}

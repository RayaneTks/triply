<?php

namespace Database\Factories;

use App\Models\Voyage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ShareLink>
 */
class ShareLinkFactory extends Factory
{
    public function definition(): array
    {
        return [
            'voyage_id' => Voyage::factory(),
            'token' => Str::random(32),
            'expires_at' => now()->addDays(30),
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subDay(),
        ]);
    }

    public function neverExpires(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => null,
        ]);
    }
}

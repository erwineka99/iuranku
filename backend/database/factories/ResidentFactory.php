<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ResidentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'full_name'     => fake()->name(),
            'phone'         => fake()->unique()->numerify('08##########'),
            'resident_type' => fake()->randomElement(['permanent', 'contract']),
            'is_married'    => fake()->boolean(),
            'ktp_photo'     => null,
        ];
    }
}

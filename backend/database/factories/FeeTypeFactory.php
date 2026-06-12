<?php

namespace Database\Factories;

use App\Models\FeeType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FeeType>
 */
class FeeTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name'        => fake()->unique()->words(3, true),
            'amount'      => fake()->randomElement([15000, 50000, 100000, 150000]),
            'description' => null,
        ];
    }
}

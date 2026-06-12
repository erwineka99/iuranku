<?php

namespace Database\Factories;

use App\Models\HouseResident;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HouseResident>
 */
class HouseResidentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'moved_in_at'  => fake()->dateTimeBetween('-2 years', '-1 month')->format('Y-m-d'),
            'moved_out_at' => null,
            'is_active'    => true,
            'notes'        => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => [
            'moved_out_at' => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'is_active'    => false,
        ]);
    }
}

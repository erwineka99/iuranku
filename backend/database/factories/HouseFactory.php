<?php

namespace Database\Factories;

use App\Models\House;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<House>
 */
class HouseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $counter = 0;
        $counter++;
        $block = fake()->randomElement(['A', 'B', 'C', 'D']);

        return [
            'number'      => (string) $counter,
            'block'       => $block,
            'address'     => fake()->streetAddress(),
            'description' => null,
            'status'      => 'unoccupied',
        ];
    }
}

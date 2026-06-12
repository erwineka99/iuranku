<?php

namespace Database\Factories;

use App\Models\Bill;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Bill>
 */
class BillFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $month = 0;
        $month = ($month % 12) + 1;

        return [
            'year'   => now()->year,
            'month'  => $month,
            'amount' => fake()->randomElement([15000, 100000]),
            'status' => 'unpaid',
            'notes'  => null,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => ['status' => 'paid']);
    }
}

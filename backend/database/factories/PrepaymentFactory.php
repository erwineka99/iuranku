<?php

namespace Database\Factories;

use App\Models\Prepayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Prepayment>
 */
class PrepaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = fake()->randomElement([500000, 1000000, 1500000, 2000000]);
        return [
            'amount'            => $amount,
            'remaining_balance' => $amount,
            'paid_at'           => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'notes'             => null,
        ];
    }
}

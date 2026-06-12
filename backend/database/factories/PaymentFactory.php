<?php

namespace Database\Factories;

use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'paid_at'      => fake()->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
            'total_amount' => fake()->randomElement([15000, 100000, 115000]),
            'notes'        => null,
        ];
    }
}

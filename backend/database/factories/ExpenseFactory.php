<?php

namespace Database\Factories;

use App\Models\Expense;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category'     => fake()->randomElement(['Gaji', 'Listrik', 'Infrastruktur', 'Kebersihan', 'Lainnya']),
            'description'  => fake()->sentence(4),
            'amount'       => fake()->numberBetween(50000, 2000000),
            'expense_date' => fake()->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
            'notes'        => null,
        ];
    }
}

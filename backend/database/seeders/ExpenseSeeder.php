<?php

namespace Database\Seeders;

use App\Models\Expense;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $expenses = [
            ['category' => 'Gaji',          'description' => 'Gaji satpam Januari 2026',          'amount' => 1500000, 'expense_date' => '2026-01-01', 'notes' => null],
            ['category' => 'Listrik',        'description' => 'Token listrik pos satpam Jan 2026',  'amount' => 150000,  'expense_date' => '2026-01-03', 'notes' => null],
            ['category' => 'Gaji',          'description' => 'Gaji satpam Februari 2026',          'amount' => 1500000, 'expense_date' => '2026-02-01', 'notes' => null],
            ['category' => 'Listrik',        'description' => 'Token listrik pos satpam Feb 2026',  'amount' => 150000,  'expense_date' => '2026-02-03', 'notes' => null],
            ['category' => 'Infrastruktur', 'description' => 'Perbaikan selokan blok A',            'amount' => 500000,  'expense_date' => '2026-02-15', 'notes' => 'Selokan mampet di depan A3'],
        ];

        foreach ($expenses as $expense) {
            Expense::create($expense);
        }
    }
}

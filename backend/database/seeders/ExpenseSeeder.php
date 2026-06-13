<?php

namespace Database\Seeders;

use App\Models\Expense;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $expenses = [
            // Januari 2026
            ['category' => 'Gaji',          'description' => 'Gaji satpam Januari 2026',         'amount' => 1500000, 'expense_date' => '2026-01-01'],
            ['category' => 'Listrik',        'description' => 'Token listrik pos satpam Jan 2026', 'amount' => 150000,  'expense_date' => '2026-01-03'],

            // Februari 2026
            ['category' => 'Gaji',          'description' => 'Gaji satpam Februari 2026',         'amount' => 1500000, 'expense_date' => '2026-02-01'],
            ['category' => 'Listrik',        'description' => 'Token listrik pos satpam Feb 2026', 'amount' => 150000,  'expense_date' => '2026-02-03'],
            ['category' => 'Infrastruktur', 'description' => 'Perbaikan selokan blok B',           'amount' => 500000,  'expense_date' => '2026-02-15', 'notes' => 'Selokan mampet di depan B3 dan B4'],

            // Maret 2026
            ['category' => 'Gaji',          'description' => 'Gaji satpam Maret 2026',            'amount' => 1500000, 'expense_date' => '2026-03-01'],
            ['category' => 'Listrik',        'description' => 'Token listrik pos satpam Mar 2026', 'amount' => 150000,  'expense_date' => '2026-03-03'],
            ['category' => 'Kebersihan',    'description' => 'Beli alat kebersihan lingkungan',   'amount' => 250000,  'expense_date' => '2026-03-10'],

            // April 2026
            ['category' => 'Gaji',          'description' => 'Gaji satpam April 2026',            'amount' => 1500000, 'expense_date' => '2026-04-01'],
            ['category' => 'Listrik',        'description' => 'Token listrik pos satpam Apr 2026', 'amount' => 150000,  'expense_date' => '2026-04-03'],
            ['category' => 'Infrastruktur', 'description' => 'Perbaikan jalan blok A',            'amount' => 800000,  'expense_date' => '2026-04-20', 'notes' => 'Aspal retak di depan A3 dan A4'],

            // Mei 2026
            ['category' => 'Gaji',          'description' => 'Gaji satpam Mei 2026',              'amount' => 1500000, 'expense_date' => '2026-05-01'],
            ['category' => 'Listrik',        'description' => 'Token listrik pos satpam Mei 2026', 'amount' => 150000,  'expense_date' => '2026-05-03'],
            ['category' => 'Kebersihan',    'description' => 'Pengecatan pagar blok C',           'amount' => 600000,  'expense_date' => '2026-05-12'],

            // Juni 2026
            ['category' => 'Gaji',          'description' => 'Gaji satpam Juni 2026',             'amount' => 1500000, 'expense_date' => '2026-06-01'],
            ['category' => 'Listrik',        'description' => 'Token listrik pos satpam Jun 2026', 'amount' => 150000,  'expense_date' => '2026-06-03'],
            ['category' => 'Infrastruktur', 'description' => 'Perbaikan lampu jalan blok D',      'amount' => 350000,  'expense_date' => '2026-06-08'],
        ];

        foreach ($expenses as $expense) {
            Expense::create(array_merge(['notes' => null], $expense));
        }
    }
}

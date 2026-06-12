<?php

namespace Database\Seeders;

use App\Models\FeeType;
use Illuminate\Database\Seeder;

class FeeTypeSeeder extends Seeder
{
    public function run(): void
    {
        FeeType::firstOrCreate(
            ['name' => 'Iuran Satpam'],
            ['amount' => 100000, 'description' => 'Iuran untuk gaji satpam perumahan']
        );

        FeeType::firstOrCreate(
            ['name' => 'Iuran Kebersihan'],
            ['amount' => 15000, 'description' => 'Iuran untuk kebersihan lingkungan']
        );
    }
}

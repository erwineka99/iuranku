<?php

namespace Database\Seeders;

use App\Models\Resident;
use Illuminate\Database\Seeder;

class ResidentSeeder extends Seeder
{
    public function run(): void
    {
        $residents = [
            ['full_name' => 'Budi Santoso',   'phone' => '081111111101', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Siti Rahayu',     'phone' => '081111111102', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Ahmad Fauzi',     'phone' => '081111111103', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Dewi Lestari',    'phone' => '081111111104', 'resident_type' => 'permanent', 'is_married' => false],
            ['full_name' => 'Andi Wijaya',     'phone' => '081111111105', 'resident_type' => 'contract',  'is_married' => false],
        ];

        foreach ($residents as $resident) {
            Resident::create($resident);
        }
    }
}

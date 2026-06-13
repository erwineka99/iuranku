<?php

namespace Database\Seeders;

use App\Models\Resident;
use Illuminate\Database\Seeder;

class ResidentSeeder extends Seeder
{
    public function run(): void
    {
        // 15 penghuni tetap + 2 penghuni kontrak = 17 penghuni
        $residents = [
            // penghuni tetap
            ['full_name' => 'Budi Santoso',       'phone' => '081111111101', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Siti Rahayu',         'phone' => '081111111102', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Ahmad Fauzi',         'phone' => '081111111103', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Dewi Lestari',        'phone' => '081111111104', 'resident_type' => 'permanent', 'is_married' => false],
            ['full_name' => 'Hendra Gunawan',      'phone' => '081111111105', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Rina Wulandari',      'phone' => '081111111106', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Dian Permana',        'phone' => '081111111107', 'resident_type' => 'permanent', 'is_married' => false],
            ['full_name' => 'Yusuf Hakim',         'phone' => '081111111108', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Mega Putri',          'phone' => '081111111109', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Rizky Firmansyah',   'phone' => '081111111110', 'resident_type' => 'permanent', 'is_married' => false],
            ['full_name' => 'Lina Marlina',        'phone' => '081111111111', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Agus Setiawan',       'phone' => '081111111112', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Tari Kusuma',         'phone' => '081111111113', 'resident_type' => 'permanent', 'is_married' => false],
            ['full_name' => 'Bambang Wijaya',      'phone' => '081111111114', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Nurul Hidayah',       'phone' => '081111111115', 'resident_type' => 'permanent', 'is_married' => true],

            // penghuni kontrak
            ['full_name' => 'Andi Wijaya',         'phone' => '081111111116', 'resident_type' => 'contract', 'is_married' => false],
            ['full_name' => 'Sari Indah',          'phone' => '081111111117', 'resident_type' => 'contract', 'is_married' => false],
        ];

        foreach ($residents as $resident) {
            Resident::create($resident);
        }
    }
}

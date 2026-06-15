<?php

namespace Database\Seeders;

use App\Models\Resident;
use Illuminate\Database\Seeder;

class ResidentSeeder extends Seeder
{
    public function run(): void
    {
        // 15 penghuni tetap (permanent) — menghuni 15 rumah tetap
        // 3 penghuni kontrak — menghuni 3 dari 5 rumah non-tetap (C1–C3)
        // C4 & C5 dibiarkan kosong
        $residents = [
            // Permanent (id 1–15)
            ['full_name' => 'Budi Santoso',       'phone' => '081111111101', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Siti Rahayu',         'phone' => '081111111102', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Ahmad Fauzi',         'phone' => '081111111103', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Dewi Lestari',        'phone' => '081111111104', 'resident_type' => 'permanent', 'is_married' => false],
            ['full_name' => 'Rudi Hartono',        'phone' => '081111111105', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Rina Wulandari',      'phone' => '081111111106', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Hendra Kusuma',       'phone' => '081111111107', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Maya Sari',           'phone' => '081111111108', 'resident_type' => 'permanent', 'is_married' => false],
            ['full_name' => 'Doni Prasetyo',       'phone' => '081111111109', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Fitri Handayani',     'phone' => '081111111110', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Wahyu Nugroho',       'phone' => '081111111111', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Lina Agustina',       'phone' => '081111111112', 'resident_type' => 'permanent', 'is_married' => false],
            ['full_name' => 'Agus Setiawan',       'phone' => '081111111113', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Yuni Astuti',         'phone' => '081111111114', 'resident_type' => 'permanent', 'is_married' => true],
            ['full_name' => 'Bambang Irawan',      'phone' => '081111111115', 'resident_type' => 'permanent', 'is_married' => true],
            // Kontrak (id 16–18)
            ['full_name' => 'Andi Wijaya',         'phone' => '081111111116', 'resident_type' => 'contract',  'is_married' => false],
            ['full_name' => 'Citra Permata',       'phone' => '081111111117', 'resident_type' => 'contract',  'is_married' => true],
            ['full_name' => 'Farhan Ramadhan',     'phone' => '081111111118', 'resident_type' => 'contract',  'is_married' => false],
        ];

        foreach ($residents as $resident) {
            Resident::create($resident);
        }
    }
}

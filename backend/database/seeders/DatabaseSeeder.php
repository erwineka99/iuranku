<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. buat akun super_admin
        User::create([
            'name'     => 'Admin RT',
            'email'    => 'admin@iuranku.com',
            'password' => Hash::make('iuranku123'),
            'role'     => 'super_admin',
        ]);

        // 2. buat akun admin biasa
        User::create([
            'name'     => 'Petugas RT',
            'email'    => 'petugas@iuranku.com',
            'password' => Hash::make('iuranku123'),
            'role'     => 'admin',
        ]);

        // 3. data master & operasional (urutan penting — tidak boleh ditukar)
        $this->call([
            FeeTypeSeeder::class,       // jenis iuran (diperlukan BillSeeder)
            HouseSeeder::class,         // 20 rumah
            ResidentSeeder::class,      // 17 penghuni
            HouseResidentSeeder::class, // assign penghuni ke rumah + buat user resident
            BillSeeder::class,          // tagihan 6 bulan (Jan–Jun 2026)
            PaymentSeeder::class,       // simulasi pembayaran
            ExpenseSeeder::class,       // pengeluaran RT 6 bulan
        ]);
    }
}

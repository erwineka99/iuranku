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
            FeeTypeSeeder::class,       // 2 jenis iuran
            HouseSeeder::class,         // 5 rumah (blok A)
            ResidentSeeder::class,      // 5 penghuni
            HouseResidentSeeder::class, // 4 rumah dihuni, 1 kosong + buat user resident
            BillSeeder::class,          // tagihan Jan–Feb 2026
            PaymentSeeder::class,       // Jan sudah lunas, Feb masih unpaid
            ExpenseSeeder::class,       // 5 pengeluaran
        ]);
    }
}

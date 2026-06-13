<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // buat akun super admin default untuk login pertama kali
        User::firstOrCreate(
            ['email' => 'admin@iuranku.com'],
            [
                'name'     => 'Admin RT',
                'password' => Hash::make('iuranku123'),
                'role'     => 'super_admin',
            ]
        );

        $this->call([
            FeeTypeSeeder::class,
        ]);
    }
}

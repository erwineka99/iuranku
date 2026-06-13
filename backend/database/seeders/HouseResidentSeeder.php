<?php

namespace Database\Seeders;

use App\Models\House;
use App\Models\HouseResident;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class HouseResidentSeeder extends Seeder
{
    public function run(): void
    {
        // 4 rumah dihuni, 1 rumah (A5) dibiarkan kosong
        $assignments = [
            1 => [1, '2022-01-01'],
            2 => [2, '2022-02-01'],
            3 => [3, '2022-01-15'],
            4 => [4, '2022-03-01'],
            // house 5 kosong, resident 5 (Andi — kontrak) masuk ke rumah berbeda
            // tapi karena rumah hanya 5 dan 1 kosong, skip resident ke-5 agar sesuai skenario
        ];

        foreach ($assignments as $houseId => [$residentId, $movedIn]) {
            HouseResident::create([
                'house_id'    => $houseId,
                'resident_id' => $residentId,
                'moved_in_at' => $movedIn,
                'is_active'   => true,
                'notes'       => null,
            ]);

            House::find($houseId)->update(['status' => 'occupied']);

            $resident = Resident::find($residentId);
            User::firstOrCreate(
                ['email' => $resident->phone . '@iuranku.com'],
                [
                    'name'        => $resident->full_name,
                    'password'    => Hash::make($resident->phone),
                    'role'        => 'resident',
                    'resident_id' => $resident->id,
                ]
            );
        }

        // rumah A5 (house_id 5) dibiarkan unoccupied
    }
}

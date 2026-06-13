<?php

namespace Database\Seeders;

use App\Models\House;
use Illuminate\Database\Seeder;

class HouseSeeder extends Seeder
{
    public function run(): void
    {
        $houses = [
            ['number' => '1', 'block' => 'A', 'address' => 'Jl. Mawar No. 1', 'description' => null],
            ['number' => '2', 'block' => 'A', 'address' => 'Jl. Mawar No. 2', 'description' => null],
            ['number' => '3', 'block' => 'A', 'address' => 'Jl. Mawar No. 3', 'description' => 'Dekat pos satpam'],
            ['number' => '4', 'block' => 'A', 'address' => 'Jl. Mawar No. 4', 'description' => null],
            ['number' => '5', 'block' => 'A', 'address' => 'Jl. Mawar No. 5', 'description' => 'Rumah pojok'],
        ];

        foreach ($houses as $house) {
            House::create(array_merge($house, ['status' => 'unoccupied']));
        }
    }
}

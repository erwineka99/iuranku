<?php

namespace Database\Seeders;

use App\Models\House;
use Illuminate\Database\Seeder;

class HouseSeeder extends Seeder
{
    public function run(): void
    {
        $houses = [
            // Blok A — 5 rumah
            ['number' => '1', 'block' => 'A', 'address' => 'Jl. Mawar No. 1', 'description' => null],
            ['number' => '2', 'block' => 'A', 'address' => 'Jl. Mawar No. 2', 'description' => null],
            ['number' => '3', 'block' => 'A', 'address' => 'Jl. Mawar No. 3', 'description' => 'Dekat pos satpam'],
            ['number' => '4', 'block' => 'A', 'address' => 'Jl. Mawar No. 4', 'description' => null],
            ['number' => '5', 'block' => 'A', 'address' => 'Jl. Mawar No. 5', 'description' => 'Rumah pojok'],

            // Blok B — 5 rumah
            ['number' => '1', 'block' => 'B', 'address' => 'Jl. Melati No. 1', 'description' => null],
            ['number' => '2', 'block' => 'B', 'address' => 'Jl. Melati No. 2', 'description' => null],
            ['number' => '3', 'block' => 'B', 'address' => 'Jl. Melati No. 3', 'description' => null],
            ['number' => '4', 'block' => 'B', 'address' => 'Jl. Melati No. 4', 'description' => 'Dekat taman'],
            ['number' => '5', 'block' => 'B', 'address' => 'Jl. Melati No. 5', 'description' => null],

            // Blok C — 5 rumah
            ['number' => '1', 'block' => 'C', 'address' => 'Jl. Kenanga No. 1', 'description' => null],
            ['number' => '2', 'block' => 'C', 'address' => 'Jl. Kenanga No. 2', 'description' => null],
            ['number' => '3', 'block' => 'C', 'address' => 'Jl. Kenanga No. 3', 'description' => null],
            ['number' => '4', 'block' => 'C', 'address' => 'Jl. Kenanga No. 4', 'description' => 'Rumah hook'],
            ['number' => '5', 'block' => 'C', 'address' => 'Jl. Kenanga No. 5', 'description' => null],

            // Blok D — 5 rumah
            ['number' => '1', 'block' => 'D', 'address' => 'Jl. Anggrek No. 1', 'description' => null],
            ['number' => '2', 'block' => 'D', 'address' => 'Jl. Anggrek No. 2', 'description' => null],
            ['number' => '3', 'block' => 'D', 'address' => 'Jl. Anggrek No. 3', 'description' => null],
            ['number' => '4', 'block' => 'D', 'address' => 'Jl. Anggrek No. 4', 'description' => null],
            ['number' => '5', 'block' => 'D', 'address' => 'Jl. Anggrek No. 5', 'description' => 'Ujung jalan'],
        ];

        foreach ($houses as $house) {
            House::create(array_merge($house, ['status' => 'unoccupied']));
        }
    }
}

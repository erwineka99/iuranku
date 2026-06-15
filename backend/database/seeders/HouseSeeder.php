<?php

namespace Database\Seeders;

use App\Models\House;
use Illuminate\Database\Seeder;

class HouseSeeder extends Seeder
{
    public function run(): void
    {
        // Blok A: 8 rumah (Jl. Mawar)
        // Blok B: 7 rumah (Jl. Melati)
        // Blok C: 5 rumah (Jl. Anggrek) — termasuk 2 yang sering kosong
        $houses = [
            ['number' => '1',  'block' => 'A', 'address' => 'Jl. Mawar No. 1',   'description' => null],
            ['number' => '2',  'block' => 'A', 'address' => 'Jl. Mawar No. 2',   'description' => null],
            ['number' => '3',  'block' => 'A', 'address' => 'Jl. Mawar No. 3',   'description' => 'Dekat pos satpam'],
            ['number' => '4',  'block' => 'A', 'address' => 'Jl. Mawar No. 4',   'description' => null],
            ['number' => '5',  'block' => 'A', 'address' => 'Jl. Mawar No. 5',   'description' => null],
            ['number' => '6',  'block' => 'A', 'address' => 'Jl. Mawar No. 6',   'description' => null],
            ['number' => '7',  'block' => 'A', 'address' => 'Jl. Mawar No. 7',   'description' => 'Rumah pojok'],
            ['number' => '8',  'block' => 'A', 'address' => 'Jl. Mawar No. 8',   'description' => null],
            ['number' => '1',  'block' => 'B', 'address' => 'Jl. Melati No. 1',  'description' => null],
            ['number' => '2',  'block' => 'B', 'address' => 'Jl. Melati No. 2',  'description' => null],
            ['number' => '3',  'block' => 'B', 'address' => 'Jl. Melati No. 3',  'description' => null],
            ['number' => '4',  'block' => 'B', 'address' => 'Jl. Melati No. 4',  'description' => 'Dekat taman'],
            ['number' => '5',  'block' => 'B', 'address' => 'Jl. Melati No. 5',  'description' => null],
            ['number' => '6',  'block' => 'B', 'address' => 'Jl. Melati No. 6',  'description' => null],
            ['number' => '7',  'block' => 'B', 'address' => 'Jl. Melati No. 7',  'description' => 'Rumah pojok'],
            ['number' => '1',  'block' => 'C', 'address' => 'Jl. Anggrek No. 1', 'description' => null],
            ['number' => '2',  'block' => 'C', 'address' => 'Jl. Anggrek No. 2', 'description' => null],
            ['number' => '3',  'block' => 'C', 'address' => 'Jl. Anggrek No. 3', 'description' => null],
            ['number' => '4',  'block' => 'C', 'address' => 'Jl. Anggrek No. 4', 'description' => 'Sering kosong'],
            ['number' => '5',  'block' => 'C', 'address' => 'Jl. Anggrek No. 5', 'description' => 'Sering kosong'],
        ];

        foreach ($houses as $house) {
            House::create(array_merge($house, ['status' => 'unoccupied']));
        }
    }
}

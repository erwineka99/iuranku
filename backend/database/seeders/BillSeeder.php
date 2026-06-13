<?php

namespace Database\Seeders;

use App\Models\Bill;
use App\Models\FeeType;
use App\Models\HouseResident;
use Illuminate\Database\Seeder;

class BillSeeder extends Seeder
{
    public function run(): void
    {
        $feeTypes = FeeType::all();
        $activeHouseResidents = HouseResident::where('is_active', true)->get();

        $periods = [
            ['year' => 2026, 'month' => 1],
            ['year' => 2026, 'month' => 2],
        ];

        foreach ($periods as $period) {
            foreach ($activeHouseResidents as $hr) {
                foreach ($feeTypes as $feeType) {
                    $exists = Bill::where('house_id', $hr->house_id)
                        ->where('fee_type_id', $feeType->id)
                        ->where('year', $period['year'])
                        ->where('month', $period['month'])
                        ->exists();

                    if ($exists) continue;

                    Bill::create([
                        'house_id'    => $hr->house_id,
                        'resident_id' => $hr->resident_id,
                        'fee_type_id' => $feeType->id,
                        'year'        => $period['year'],
                        'month'       => $period['month'],
                        'amount'      => $feeType->amount,
                        'status'      => 'unpaid',
                        'notes'       => null,
                    ]);
                }
            }
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\Bill;
use App\Models\FeeType;
use App\Models\House;
use App\Models\HouseResident;
use Illuminate\Database\Seeder;

class BillSeeder extends Seeder
{
    public function run(): void
    {
        $feeTypes    = FeeType::all();
        $activeHouseResidents = HouseResident::where('is_active', true)->with(['house', 'resident'])->get();

        // generate tagihan untuk 6 bulan terakhir: Januari–Juni 2026
        $periods = [
            ['year' => 2026, 'month' => 1],
            ['year' => 2026, 'month' => 2],
            ['year' => 2026, 'month' => 3],
            ['year' => 2026, 'month' => 4],
            ['year' => 2026, 'month' => 5],
            ['year' => 2026, 'month' => 6],
        ];

        foreach ($periods as $period) {
            foreach ($activeHouseResidents as $hr) {
                foreach ($feeTypes as $feeType) {
                    // skip jika sudah ada
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

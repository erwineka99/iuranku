<?php

namespace Database\Seeders;

use App\Models\Bill;
use App\Models\Payment;
use App\Models\PaymentItem;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        // semua penghuni sudah lunas bulan Januari 2026
        $janBills = Bill::where('year', 2026)
            ->where('month', 1)
            ->where('status', 'unpaid')
            ->get()
            ->groupBy('resident_id');

        foreach ($janBills as $residentId => $bills) {
            $payment = Payment::create([
                'resident_id'  => $residentId,
                'paid_at'      => '2026-02-05',
                'total_amount' => $bills->sum('amount'),
                'notes'        => 'Pembayaran iuran Januari 2026',
            ]);

            foreach ($bills as $bill) {
                PaymentItem::create([
                    'payment_id' => $payment->id,
                    'bill_id'    => $bill->id,
                    'amount'     => $bill->amount,
                ]);
                $bill->update(['status' => 'paid']);
            }
        }

        // bulan Februari 2026 → semua masih unpaid (belum jatuh tempo / simulasi tunggakan)
    }
}

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
        // simulasi: semua penghuni sudah bayar bulan Jan–Apr 2026
        // bulan Mei & Jun 2026 sebagian belum bayar (untuk simulasi tunggakan)
        $paidMonths = [1, 2, 3, 4];

        $billsByResident = Bill::whereIn('month', $paidMonths)
            ->where('year', 2026)
            ->where('status', 'unpaid')
            ->get()
            ->groupBy('resident_id');

        foreach ($billsByResident as $residentId => $bills) {
            // bayar semua tagihan Jan–Apr sekaligus per resident
            $total = $bills->sum('amount');

            $payment = Payment::create([
                'resident_id'  => $residentId,
                'paid_at'      => '2026-05-05',
                'total_amount' => $total,
                'notes'        => 'Pembayaran iuran Januari–April 2026',
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

        // simulasi: sebagian penghuni (resident_id 1–5) sudah bayar bulan Mei 2026
        $mayBills = Bill::where('year', 2026)
            ->where('month', 5)
            ->where('status', 'unpaid')
            ->whereIn('resident_id', [1, 2, 3, 4, 5])
            ->get()
            ->groupBy('resident_id');

        foreach ($mayBills as $residentId => $bills) {
            $total = $bills->sum('amount');

            $payment = Payment::create([
                'resident_id'  => $residentId,
                'paid_at'      => '2026-06-03',
                'total_amount' => $total,
                'notes'        => 'Pembayaran iuran Mei 2026',
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

        // bulan Mei resident 6–17 dan bulan Juni semua → masih unpaid (tunggakan)
    }
}

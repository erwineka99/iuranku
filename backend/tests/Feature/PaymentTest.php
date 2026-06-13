<?php

use App\Models\Bill;
use App\Models\FeeType;
use App\Models\House;
use App\Models\HouseResident;
use App\Models\Payment;
use App\Models\PaymentItem;
use App\Models\Resident;

// helper: buat rumah+penghuni aktif + beberapa tagihan unpaid
function setupBills(int $count = 2): array
{
    $house    = House::factory()->create(['status' => 'occupied']);
    $resident = Resident::factory()->create();
    HouseResident::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'is_active'   => true,
    ]);
    $feeType = FeeType::factory()->create(['amount' => 100000]);

    $bills = collect();
    for ($i = 1; $i <= $count; $i++) {
        $bills->push(Bill::factory()->create([
            'house_id'    => $house->id,
            'resident_id' => $resident->id,
            'fee_type_id' => $feeType->id,
            'month'       => $i,
            'status'      => 'unpaid',
        ]));
    }

    return [$resident, $bills, $house];
}

// ── GET /api/payments ──────────────────────────────────────────────────────────

test('unauthenticated user tidak bisa akses pembayaran', function () {
    $this->getJson('/api/payments')->assertStatus(401);
});

test('dapat mengambil daftar pembayaran', function () {
    $token = makeAdminToken();
    [$resident, $bills] = setupBills(2);

    $payment = Payment::factory()->create(['resident_id' => $resident->id]);
    PaymentItem::create(['payment_id' => $payment->id, 'bill_id' => $bills[0]->id, 'amount' => $bills[0]->amount]);
    PaymentItem::create(['payment_id' => $payment->id, 'bill_id' => $bills[1]->id, 'amount' => $bills[1]->amount]);

    $this->withToken($token)
        ->getJson('/api/payments')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonStructure(['data', 'meta' => ['total', 'total_amount']]);
});

test('dapat filter pembayaran berdasarkan resident_id', function () {
    $token = makeAdminToken();
    [$resident1, $bills1] = setupBills(1);
    [$resident2, $bills2] = setupBills(1);

    $p1 = Payment::factory()->create(['resident_id' => $resident1->id]);
    PaymentItem::create(['payment_id' => $p1->id, 'bill_id' => $bills1[0]->id, 'amount' => 100000]);

    $p2 = Payment::factory()->create(['resident_id' => $resident2->id]);
    PaymentItem::create(['payment_id' => $p2->id, 'bill_id' => $bills2[0]->id, 'amount' => 100000]);

    $this->withToken($token)
        ->getJson("/api/payments?resident_id={$resident1->id}")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.resident.id', $resident1->id);
});

// ── POST /api/payments ─────────────────────────────────────────────────────────

test('dapat mencatat pembayaran multi-tagihan', function () {
    $token = makeAdminToken();
    [$resident, $bills] = setupBills(3);

    $billIds     = $bills->pluck('id')->toArray();
    $totalAmount = $bills->sum('amount');

    $this->withToken($token)
        ->postJson('/api/payments', [
            'resident_id' => $resident->id,
            'paid_at'     => now()->toDateString(),
            'bill_ids'    => $billIds,
            'notes'       => 'Bayar 3 bulan sekaligus',
        ])
        ->assertStatus(201)
        ->assertJsonPath('data.total_amount', $totalAmount)
        ->assertJsonCount(3, 'data.items')
        ->assertJsonStructure(['message', 'data' => ['id', 'resident', 'paid_at', 'total_amount', 'items']]);

    // semua bill harus berubah jadi paid
    foreach ($billIds as $id) {
        $this->assertDatabaseHas('bills', ['id' => $id, 'status' => 'paid']);
    }

    $this->assertDatabaseHas('payments', ['resident_id' => $resident->id, 'total_amount' => $totalAmount]);
    $this->assertDatabaseCount('payment_items', 3);
});

test('gagal catat pembayaran jika tagihan sudah lunas', function () {
    $token = makeAdminToken();
    [$resident, $bills] = setupBills(1);

    $bills[0]->update(['status' => 'paid']);

    $this->withToken($token)
        ->postJson('/api/payments', [
            'resident_id' => $resident->id,
            'paid_at'     => now()->toDateString(),
            'bill_ids'    => [$bills[0]->id],
        ])
        ->assertStatus(422)
        ->assertJsonFragment(['message' => 'Beberapa tagihan sudah lunas']);
});

test('gagal catat pembayaran jika tagihan bukan milik penghuni', function () {
    $token = makeAdminToken();
    [$resident1, $bills1] = setupBills(1);
    [$resident2, $bills2] = setupBills(1);

    $this->withToken($token)
        ->postJson('/api/payments', [
            'resident_id' => $resident1->id,
            'paid_at'     => now()->toDateString(),
            'bill_ids'    => [$bills2[0]->id],
        ])
        ->assertStatus(422)
        ->assertJsonFragment(['message' => 'Beberapa tagihan bukan milik penghuni yang dipilih']);
});

test('gagal catat pembayaran jika paid_at di masa depan', function () {
    $token = makeAdminToken();
    [$resident, $bills] = setupBills(1);

    $this->withToken($token)
        ->postJson('/api/payments', [
            'resident_id' => $resident->id,
            'paid_at'     => now()->addDay()->toDateString(),
            'bill_ids'    => [$bills[0]->id],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['paid_at']);
});

test('gagal catat pembayaran jika bill_ids kosong', function () {
    $token = makeAdminToken();
    [$resident] = setupBills(1);

    $this->withToken($token)
        ->postJson('/api/payments', [
            'resident_id' => $resident->id,
            'paid_at'     => now()->toDateString(),
            'bill_ids'    => [],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['bill_ids']);
});

// ── GET /api/payments/{id} ─────────────────────────────────────────────────────

test('dapat mengambil detail pembayaran', function () {
    $token = makeAdminToken();
    [$resident, $bills] = setupBills(1);

    $payment = Payment::factory()->create(['resident_id' => $resident->id, 'total_amount' => 100000]);
    PaymentItem::create(['payment_id' => $payment->id, 'bill_id' => $bills[0]->id, 'amount' => 100000]);

    $this->withToken($token)
        ->getJson("/api/payments/{$payment->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $payment->id)
        ->assertJsonStructure(['data' => ['id', 'resident', 'paid_at', 'total_amount', 'items']]);
});

test('detail pembayaran yang tidak ada mengembalikan 404', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->getJson('/api/payments/9999')
        ->assertStatus(404);
});

// ── DELETE /api/payments/{id} ──────────────────────────────────────────────────

test('dapat membatalkan pembayaran dan tagihan kembali ke unpaid', function () {
    $token = makeSuperAdminToken();
    [$resident, $bills] = setupBills(2);

    // catat pembayaran
    $payment = Payment::factory()->create(['resident_id' => $resident->id, 'total_amount' => 200000]);
    foreach ($bills as $bill) {
        PaymentItem::create(['payment_id' => $payment->id, 'bill_id' => $bill->id, 'amount' => $bill->amount]);
        $bill->update(['status' => 'paid']);
    }

    $this->withToken($token)
        ->deleteJson("/api/payments/{$payment->id}")
        ->assertOk()
        ->assertJsonFragment(['message' => 'Pembayaran berhasil dihapus dan tagihan terkait dikembalikan ke status belum lunas']);

    // payment dan items harus terhapus
    $this->assertDatabaseMissing('payments', ['id' => $payment->id]);
    $this->assertDatabaseCount('payment_items', 0);

    // semua bill harus kembali ke unpaid
    foreach ($bills as $bill) {
        $this->assertDatabaseHas('bills', ['id' => $bill->id, 'status' => 'unpaid']);
    }
});

test('admin biasa tidak bisa hapus pembayaran (403)', function () {
    $token = makeAdminOnlyToken();
    [$resident, $bills] = setupBills(1);

    $payment = Payment::factory()->create(['resident_id' => $resident->id, 'total_amount' => 100000]);
    PaymentItem::create(['payment_id' => $payment->id, 'bill_id' => $bills[0]->id, 'amount' => 100000]);

    $this->withToken($token)
        ->deleteJson("/api/payments/{$payment->id}")
        ->assertStatus(403);
});

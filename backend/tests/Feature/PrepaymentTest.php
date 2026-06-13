<?php

use App\Models\Bill;
use App\Models\FeeType;
use App\Models\House;
use App\Models\HouseResident;
use App\Models\Prepayment;
use App\Models\Resident;

// ── POST /api/prepayments ──────────────────────────────────────────────────────

test('dapat mencatat prepayment untuk penghuni aktif', function () {
    $token    = makeAdminToken();
    $resident = Resident::factory()->create();
    $house    = House::factory()->create(['status' => 'occupied']);
    HouseResident::factory()->create(['house_id' => $house->id, 'resident_id' => $resident->id, 'is_active' => true]);
    $feeType = FeeType::factory()->create(['amount' => 100000]);

    $this->withToken($token)
        ->postJson('/api/prepayments', [
            'resident_id' => $resident->id,
            'fee_type_id' => $feeType->id,
            'amount'      => 1200000,
            'paid_at'     => '2026-01-01',
            'notes'       => 'Bayar dimuka 12 bulan',
        ])
        ->assertStatus(201)
        ->assertJsonPath('data.amount', 1200000)
        ->assertJsonPath('data.remaining_balance', 1200000)
        ->assertJsonPath('data.used_amount', 0)
        ->assertJsonStructure(['message', 'data' => ['id', 'resident', 'fee_type', 'amount', 'remaining_balance', 'paid_at']]);

    $this->assertDatabaseHas('prepayments', [
        'resident_id'       => $resident->id,
        'fee_type_id'       => $feeType->id,
        'amount'            => 1200000,
        'remaining_balance' => 1200000,
    ]);
});

test('gagal catat prepayment jika penghuni tidak sedang menghuni rumah', function () {
    $token    = makeAdminToken();
    $resident = Resident::factory()->create();
    $feeType  = FeeType::factory()->create();

    $this->withToken($token)
        ->postJson('/api/prepayments', [
            'resident_id' => $resident->id,
            'fee_type_id' => $feeType->id,
            'amount'      => 500000,
            'paid_at'     => '2026-01-01',
        ])
        ->assertStatus(422)
        ->assertJsonFragment(['message' => 'Penghuni tidak sedang aktif menghuni rumah']);
});

test('gagal catat prepayment jika amount nol atau negatif', function () {
    $token    = makeAdminToken();
    $resident = Resident::factory()->create();
    $feeType  = FeeType::factory()->create();

    $this->withToken($token)
        ->postJson('/api/prepayments', [
            'resident_id' => $resident->id,
            'fee_type_id' => $feeType->id,
            'amount'      => 0,
            'paid_at'     => '2026-01-01',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['amount']);
});

// ── GET /api/prepayments ───────────────────────────────────────────────────────

test('dapat mengambil daftar prepayment', function () {
    $token    = makeAdminToken();
    $resident = Resident::factory()->create();
    $feeType  = FeeType::factory()->create();

    Prepayment::factory()->count(3)->create([
        'resident_id'       => $resident->id,
        'fee_type_id'       => $feeType->id,
        'remaining_balance' => 500000,
    ]);

    $this->withToken($token)
        ->getJson('/api/prepayments')
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure(['data', 'meta' => ['total', 'total_amount', 'total_remaining']]);
});

test('dapat filter prepayment berdasarkan has_balance', function () {
    $token    = makeAdminToken();
    $resident = Resident::factory()->create();
    $feeType  = FeeType::factory()->create();

    Prepayment::factory()->create(['resident_id' => $resident->id, 'fee_type_id' => $feeType->id, 'remaining_balance' => 100000]);
    Prepayment::factory()->create(['resident_id' => $resident->id, 'fee_type_id' => $feeType->id, 'remaining_balance' => 0]);

    $this->withToken($token)
        ->getJson('/api/prepayments?has_balance=1')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

// ── DELETE /api/prepayments/{id} ──────────────────────────────────────────────

test('super_admin dapat hapus prepayment yang belum terpakai', function () {
    $token    = makeSuperAdminToken();
    $resident = Resident::factory()->create();
    $feeType  = FeeType::factory()->create();

    $prepayment = Prepayment::factory()->create([
        'resident_id'       => $resident->id,
        'fee_type_id'       => $feeType->id,
        'remaining_balance' => 500000,
    ]);

    $this->withToken($token)
        ->deleteJson("/api/prepayments/{$prepayment->id}")
        ->assertOk()
        ->assertJsonFragment(['message' => 'Pembayaran dimuka berhasil dihapus']);

    $this->assertDatabaseMissing('prepayments', ['id' => $prepayment->id]);
});

test('admin biasa tidak bisa hapus prepayment (403)', function () {
    $token    = makeAdminOnlyToken();
    $resident = Resident::factory()->create();
    $feeType  = FeeType::factory()->create();

    $prepayment = Prepayment::factory()->create([
        'resident_id'       => $resident->id,
        'fee_type_id'       => $feeType->id,
        'remaining_balance' => 500000,
    ]);

    $this->withToken($token)
        ->deleteJson("/api/prepayments/{$prepayment->id}")
        ->assertStatus(403);
});

// ── generate tagihan otomatis potong prepayment ────────────────────────────────

test('generate tagihan otomatis memotong saldo prepayment jika cukup', function () {
    $token    = makeAdminToken();
    $house    = House::factory()->create(['status' => 'occupied']);
    $resident = Resident::factory()->create();
    HouseResident::factory()->create(['house_id' => $house->id, 'resident_id' => $resident->id, 'is_active' => true]);
    $feeType = FeeType::factory()->create(['amount' => 100000]);

    // prepayment cukup untuk 3 bulan
    $prepayment = Prepayment::factory()->create([
        'resident_id'       => $resident->id,
        'fee_type_id'       => $feeType->id,
        'amount'            => 300000,
        'remaining_balance' => 300000,
        'paid_at'           => '2026-01-01',
    ]);

    $this->withToken($token)
        ->postJson('/api/bills/generate', ['year' => 2026, 'month' => 7])
        ->assertStatus(201)
        ->assertJsonPath('data.auto_paid', 1);

    // tagihan langsung paid
    $this->assertDatabaseHas('bills', [
        'resident_id' => $resident->id,
        'fee_type_id' => $feeType->id,
        'year'        => 2026,
        'month'       => 7,
        'status'      => 'paid',
    ]);

    // saldo terpotong
    expect($prepayment->fresh()->remaining_balance)->toBe(200000);

    // usage tercatat
    $bill = Bill::where('resident_id', $resident->id)->where('year', 2026)->where('month', 7)->first();
    $this->assertDatabaseHas('prepayment_usages', [
        'prepayment_id' => $prepayment->id,
        'bill_id'       => $bill->id,
        'amount_used'   => 100000,
    ]);
});

test('generate tagihan tidak memotong prepayment jika saldo tidak cukup', function () {
    $token    = makeAdminToken();
    $house    = House::factory()->create(['status' => 'occupied']);
    $resident = Resident::factory()->create();
    HouseResident::factory()->create(['house_id' => $house->id, 'resident_id' => $resident->id, 'is_active' => true]);
    $feeType = FeeType::factory()->create(['amount' => 100000]);

    // prepayment hanya 50.000, tidak cukup untuk tagihan 100.000
    $prepayment = Prepayment::factory()->create([
        'resident_id'       => $resident->id,
        'fee_type_id'       => $feeType->id,
        'amount'            => 50000,
        'remaining_balance' => 50000,
        'paid_at'           => '2026-01-01',
    ]);

    $this->withToken($token)
        ->postJson('/api/bills/generate', ['year' => 2026, 'month' => 8])
        ->assertStatus(201)
        ->assertJsonPath('data.auto_paid', 0);

    // tagihan tetap unpaid
    $this->assertDatabaseHas('bills', [
        'resident_id' => $resident->id,
        'year'        => 2026,
        'month'       => 8,
        'status'      => 'unpaid',
    ]);

    // saldo tidak berubah
    expect($prepayment->fresh()->remaining_balance)->toBe(50000);
});

test('generate tagihan pakai prepayment paling lama (FIFO) jika ada beberapa', function () {
    $token    = makeAdminToken();
    $house    = House::factory()->create(['status' => 'occupied']);
    $resident = Resident::factory()->create();
    HouseResident::factory()->create(['house_id' => $house->id, 'resident_id' => $resident->id, 'is_active' => true]);
    $feeType = FeeType::factory()->create(['amount' => 100000]);

    $older = Prepayment::factory()->create([
        'resident_id'       => $resident->id,
        'fee_type_id'       => $feeType->id,
        'amount'            => 100000,
        'remaining_balance' => 100000,
        'paid_at'           => '2026-01-01',
    ]);

    $newer = Prepayment::factory()->create([
        'resident_id'       => $resident->id,
        'fee_type_id'       => $feeType->id,
        'amount'            => 100000,
        'remaining_balance' => 100000,
        'paid_at'           => '2026-03-01',
    ]);

    $this->withToken($token)
        ->postJson('/api/bills/generate', ['year' => 2026, 'month' => 9])
        ->assertStatus(201);

    // yang dipotong adalah yang paling lama
    expect($older->fresh()->remaining_balance)->toBe(0);
    expect($newer->fresh()->remaining_balance)->toBe(100000);
});

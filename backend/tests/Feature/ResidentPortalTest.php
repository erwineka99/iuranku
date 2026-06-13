<?php

use App\Models\Bill;
use App\Models\Expense;
use App\Models\FeeType;
use App\Models\House;
use App\Models\HouseResident;
use App\Models\Payment;
use App\Models\PaymentItem;
use App\Models\Resident;

// ── guard: admin tidak bisa akses resident portal ──────────────────────────────

test('admin tidak bisa akses resident dashboard (403)', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->getJson('/api/resident/dashboard')
        ->assertStatus(403);
});

test('unauthenticated user tidak bisa akses resident portal (401)', function () {
    $this->getJson('/api/resident/dashboard')->assertStatus(401);
    $this->getJson('/api/resident/bills')->assertStatus(401);
    $this->getJson('/api/resident/payments')->assertStatus(401);
    $this->getJson('/api/resident/expenses')->assertStatus(401);
});

// ── GET /api/resident/dashboard ────────────────────────────────────────────────

test('resident dapat melihat dashboard-nya sendiri', function () {
    $resident = Resident::factory()->create();
    $house    = House::factory()->create(['status' => 'occupied']);
    HouseResident::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'is_active'   => true,
        'moved_in_at' => '2024-01-01',
    ]);

    [$token] = makeResidentToken($resident);

    $this->withToken($token)
        ->getJson('/api/resident/dashboard')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'resident' => ['id', 'full_name', 'phone', 'resident_type'],
                'house'    => ['id', 'number', 'block', 'moved_in_at'],
                'bill_summary' => ['total', 'paid', 'unpaid', 'unpaid_amount'],
            ],
        ])
        ->assertJsonPath('data.resident.id', $resident->id)
        ->assertJsonPath('data.house.id', $house->id);
});

test('dashboard resident menghitung bill_summary dengan benar', function () {
    $resident = Resident::factory()->create();
    $house    = House::factory()->create(['status' => 'occupied']);
    HouseResident::factory()->create(['house_id' => $house->id, 'resident_id' => $resident->id, 'is_active' => true]);
    $feeType = FeeType::factory()->create(['amount' => 100000]);

    Bill::factory()->create(['resident_id' => $resident->id, 'house_id' => $house->id, 'fee_type_id' => $feeType->id, 'status' => 'paid',   'amount' => 100000, 'month' => 1]);
    Bill::factory()->create(['resident_id' => $resident->id, 'house_id' => $house->id, 'fee_type_id' => $feeType->id, 'status' => 'unpaid', 'amount' => 100000, 'month' => 2]);
    Bill::factory()->create(['resident_id' => $resident->id, 'house_id' => $house->id, 'fee_type_id' => $feeType->id, 'status' => 'unpaid', 'amount' => 100000, 'month' => 3]);

    [$token] = makeResidentToken($resident);

    $this->withToken($token)
        ->getJson('/api/resident/dashboard')
        ->assertOk()
        ->assertJsonPath('data.bill_summary.total', 3)
        ->assertJsonPath('data.bill_summary.paid', 1)
        ->assertJsonPath('data.bill_summary.unpaid', 2)
        ->assertJsonPath('data.bill_summary.unpaid_amount', 200000);
});

// ── GET /api/resident/bills ────────────────────────────────────────────────────

test('resident hanya melihat tagihan miliknya sendiri', function () {
    $resident1 = Resident::factory()->create();
    $resident2 = Resident::factory()->create();
    $house1    = House::factory()->create();
    $house2    = House::factory()->create();
    HouseResident::factory()->create(['house_id' => $house1->id, 'resident_id' => $resident1->id, 'is_active' => true]);
    HouseResident::factory()->create(['house_id' => $house2->id, 'resident_id' => $resident2->id, 'is_active' => true]);
    $feeType = FeeType::factory()->create();

    Bill::factory()->count(3)->create(['resident_id' => $resident1->id, 'house_id' => $house1->id, 'fee_type_id' => $feeType->id]);
    Bill::factory()->count(5)->create(['resident_id' => $resident2->id, 'house_id' => $house2->id, 'fee_type_id' => $feeType->id]);

    [$token] = makeResidentToken($resident1);

    $this->withToken($token)
        ->getJson('/api/resident/bills')
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure(['data', 'meta' => ['total', 'paid', 'unpaid', 'unpaid_amount']]);
});

test('resident dapat filter tagihan berdasarkan status', function () {
    $resident = Resident::factory()->create();
    $house    = House::factory()->create();
    HouseResident::factory()->create(['house_id' => $house->id, 'resident_id' => $resident->id, 'is_active' => true]);
    $feeType = FeeType::factory()->create();

    Bill::factory()->create(['resident_id' => $resident->id, 'house_id' => $house->id, 'fee_type_id' => $feeType->id, 'status' => 'paid', 'month' => 1]);
    Bill::factory()->create(['resident_id' => $resident->id, 'house_id' => $house->id, 'fee_type_id' => $feeType->id, 'status' => 'unpaid', 'month' => 2]);

    [$token] = makeResidentToken($resident);

    $this->withToken($token)
        ->getJson('/api/resident/bills?status=unpaid')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.status', 'unpaid');
});

// ── GET /api/resident/payments ─────────────────────────────────────────────────

test('resident hanya melihat riwayat pembayarannya sendiri', function () {
    $resident1 = Resident::factory()->create();
    $resident2 = Resident::factory()->create();

    Payment::factory()->count(2)->create(['resident_id' => $resident1->id]);
    Payment::factory()->count(4)->create(['resident_id' => $resident2->id]);

    [$token] = makeResidentToken($resident1);

    $this->withToken($token)
        ->getJson('/api/resident/payments')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonStructure(['data', 'meta' => ['total', 'total_amount']]);
});

test('riwayat pembayaran resident menampilkan item tagihan', function () {
    $resident = Resident::factory()->create();
    $house    = House::factory()->create();
    HouseResident::factory()->create(['house_id' => $house->id, 'resident_id' => $resident->id, 'is_active' => true]);
    $feeType = FeeType::factory()->create(['amount' => 100000]);

    $bill = Bill::factory()->create([
        'resident_id' => $resident->id,
        'house_id'    => $house->id,
        'fee_type_id' => $feeType->id,
        'status'      => 'paid',
        'amount'      => 100000,
    ]);

    $payment = Payment::factory()->create(['resident_id' => $resident->id, 'total_amount' => 100000]);
    PaymentItem::create(['payment_id' => $payment->id, 'bill_id' => $bill->id, 'amount' => 100000]);

    [$token] = makeResidentToken($resident);

    $this->withToken($token)
        ->getJson('/api/resident/payments')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonStructure(['data' => [['id', 'paid_at', 'total_amount', 'items' => [['bill_id', 'fee_type', 'year', 'month', 'amount']]]]]);
});

// ── GET /api/resident/expenses ─────────────────────────────────────────────────

test('resident dapat melihat laporan pengeluaran RT', function () {
    Expense::factory()->count(5)->create();

    [$token] = makeResidentToken();

    $this->withToken($token)
        ->getJson('/api/resident/expenses')
        ->assertOk()
        ->assertJsonCount(5, 'data')
        ->assertJsonStructure([
            'data' => [['id', 'category', 'description', 'amount', 'expense_date']],
            'meta' => ['total', 'total_amount'],
        ]);
});

test('resident dapat filter pengeluaran berdasarkan tahun dan bulan', function () {
    Expense::factory()->create(['expense_date' => '2024-06-01']);
    Expense::factory()->create(['expense_date' => '2024-07-01']);
    Expense::factory()->create(['expense_date' => '2025-06-01']);

    [$token] = makeResidentToken();

    $this->withToken($token)
        ->getJson('/api/resident/expenses?year=2024&month=6')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

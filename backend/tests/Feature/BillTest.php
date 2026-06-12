<?php

use App\Models\Bill;
use App\Models\FeeType;
use App\Models\House;
use App\Models\HouseResident;
use App\Models\Resident;

// helper: buat rumah dengan penghuni aktif
function occupiedHouse(): array
{
    $house    = House::factory()->create(['status' => 'occupied']);
    $resident = Resident::factory()->create();
    $hr       = HouseResident::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'is_active'   => true,
    ]);
    return [$house, $resident, $hr];
}

// ── GET /api/bills ─────────────────────────────────────────────────────────────

test('unauthenticated user tidak bisa akses tagihan', function () {
    $this->getJson('/api/bills')->assertStatus(401);
});

test('dapat mengambil daftar tagihan', function () {
    $token = makeAdminToken();
    [$house, $resident] = occupiedHouse();
    $feeType = FeeType::factory()->create();

    Bill::factory()->count(3)->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'fee_type_id' => $feeType->id,
    ]);

    $this->withToken($token)
        ->getJson('/api/bills')
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure(['data', 'meta' => ['total', 'paid', 'unpaid', 'total_amount', 'paid_amount', 'unpaid_amount']]);
});

test('dapat filter tagihan berdasarkan status', function () {
    $token = makeAdminToken();
    [$house, $resident] = occupiedHouse();
    $feeType = FeeType::factory()->create();

    Bill::factory()->create(['house_id' => $house->id, 'resident_id' => $resident->id, 'fee_type_id' => $feeType->id, 'status' => 'paid', 'month' => 1]);
    Bill::factory()->create(['house_id' => $house->id, 'resident_id' => $resident->id, 'fee_type_id' => $feeType->id, 'status' => 'unpaid', 'month' => 2]);

    $this->withToken($token)
        ->getJson('/api/bills?status=unpaid')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.status', 'unpaid');
});

// ── POST /api/bills/generate ───────────────────────────────────────────────────

test('dapat generate tagihan bulanan', function () {
    $token = makeAdminToken();
    occupiedHouse();
    FeeType::factory()->count(2)->create();

    $this->withToken($token)
        ->postJson('/api/bills/generate', ['year' => 2024, 'month' => 6])
        ->assertStatus(201)
        ->assertJsonPath('data.generated', 2)
        ->assertJsonPath('data.skipped', 0);

    $this->assertDatabaseCount('bills', 2);
});

test('generate tagihan skip jika sudah ada', function () {
    $token = makeAdminToken();
    [$house, $resident] = occupiedHouse();
    $feeType = FeeType::factory()->create();

    Bill::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'fee_type_id' => $feeType->id,
        'year'        => 2024,
        'month'       => 6,
    ]);

    $this->withToken($token)
        ->postJson('/api/bills/generate', ['year' => 2024, 'month' => 6])
        ->assertStatus(201)
        ->assertJsonPath('data.generated', 0)
        ->assertJsonPath('data.skipped', 1);
});

test('generate tidak membuat tagihan untuk rumah kosong', function () {
    $token = makeAdminToken();
    House::factory()->create(['status' => 'unoccupied']);
    FeeType::factory()->create();

    $this->withToken($token)
        ->postJson('/api/bills/generate', ['year' => 2024, 'month' => 6])
        ->assertStatus(201)
        ->assertJsonPath('data.generated', 0);

    $this->assertDatabaseCount('bills', 0);
});

test('generate gagal jika month tidak valid', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->postJson('/api/bills/generate', ['year' => 2024, 'month' => 13])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['month']);
});

// ── POST /api/bills ────────────────────────────────────────────────────────────

test('dapat tambah tagihan manual', function () {
    $token = makeAdminToken();
    [$house, $resident] = occupiedHouse();
    $feeType = FeeType::factory()->create(['amount' => 100000]);

    $this->withToken($token)
        ->postJson('/api/bills', [
            'house_id'    => $house->id,
            'fee_type_id' => $feeType->id,
            'year'        => 2024,
            'month'       => 6,
            'amount'      => 100000,
        ])
        ->assertStatus(201)
        ->assertJsonStructure(['message', 'data']);

    $this->assertDatabaseHas('bills', [
        'house_id'    => $house->id,
        'fee_type_id' => $feeType->id,
        'status'      => 'unpaid',
    ]);
});

test('gagal tambah tagihan manual untuk rumah tanpa penghuni aktif', function () {
    $token = makeAdminToken();
    $house   = House::factory()->create(['status' => 'unoccupied']);
    $feeType = FeeType::factory()->create();

    $this->withToken($token)
        ->postJson('/api/bills', [
            'house_id'    => $house->id,
            'fee_type_id' => $feeType->id,
            'year'        => 2024,
            'month'       => 6,
            'amount'      => 100000,
        ])
        ->assertStatus(422)
        ->assertJsonFragment(['message' => 'Rumah tidak memiliki penghuni aktif']);
});

test('gagal tambah tagihan manual jika duplikat', function () {
    $token = makeAdminToken();
    [$house, $resident] = occupiedHouse();
    $feeType = FeeType::factory()->create();

    Bill::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'fee_type_id' => $feeType->id,
        'year'        => 2024,
        'month'       => 6,
    ]);

    $this->withToken($token)
        ->postJson('/api/bills', [
            'house_id'    => $house->id,
            'fee_type_id' => $feeType->id,
            'year'        => 2024,
            'month'       => 6,
            'amount'      => 100000,
        ])
        ->assertStatus(422)
        ->assertJsonFragment(['message' => 'Tagihan untuk rumah, jenis iuran, dan bulan ini sudah ada']);
});

// ── GET /api/bills/{id} ────────────────────────────────────────────────────────

test('dapat mengambil detail tagihan', function () {
    $token = makeAdminToken();
    [$house, $resident] = occupiedHouse();
    $feeType = FeeType::factory()->create();

    $bill = Bill::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'fee_type_id' => $feeType->id,
    ]);

    $this->withToken($token)
        ->getJson("/api/bills/{$bill->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $bill->id)
        ->assertJsonStructure(['data' => ['id', 'house', 'resident', 'fee_type', 'year', 'month', 'amount', 'status']]);
});

test('detail tagihan yang tidak ada mengembalikan 404', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->getJson('/api/bills/9999')
        ->assertStatus(404);
});

// ── DELETE /api/bills/{id} ─────────────────────────────────────────────────────

test('dapat menghapus tagihan yang belum lunas', function () {
    $token = makeAdminToken();
    [$house, $resident] = occupiedHouse();
    $feeType = FeeType::factory()->create();

    $bill = Bill::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'fee_type_id' => $feeType->id,
        'status'      => 'unpaid',
    ]);

    $this->withToken($token)
        ->deleteJson("/api/bills/{$bill->id}")
        ->assertOk()
        ->assertJsonFragment(['message' => 'Tagihan berhasil dihapus']);

    $this->assertDatabaseMissing('bills', ['id' => $bill->id]);
});

test('gagal hapus tagihan yang sudah lunas', function () {
    $token = makeAdminToken();
    [$house, $resident] = occupiedHouse();
    $feeType = FeeType::factory()->create();

    $bill = Bill::factory()->paid()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'fee_type_id' => $feeType->id,
    ]);

    $this->withToken($token)
        ->deleteJson("/api/bills/{$bill->id}")
        ->assertStatus(422)
        ->assertJsonFragment(['message' => 'Tagihan yang sudah lunas tidak bisa dihapus']);
});

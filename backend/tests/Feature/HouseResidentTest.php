<?php

use App\Models\House;
use App\Models\HouseResident;
use App\Models\Resident;

// ── GET /api/houses/{house}/residents ─────────────────────────────────────────

test('unauthenticated user tidak bisa akses riwayat penghuni rumah', function () {
    $house = House::factory()->create();

    $this->getJson("/api/houses/{$house->id}/residents")
        ->assertStatus(401);
});

test('dapat mengambil riwayat penghuni sebuah rumah', function () {
    $token = makeAdminToken();
    $house = House::factory()->create();
    $resident = Resident::factory()->create();

    HouseResident::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
    ]);

    $this->withToken($token)
        ->getJson("/api/houses/{$house->id}/residents")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonStructure(['data' => [['id', 'resident', 'moved_in_at', 'is_active']]]);
});

test('riwayat menampilkan penghuni aktif dan nonaktif', function () {
    $token = makeAdminToken();
    $house = House::factory()->create();

    HouseResident::factory()->create(['house_id' => $house->id, 'resident_id' => Resident::factory()->create()->id]);
    HouseResident::factory()->inactive()->create(['house_id' => $house->id, 'resident_id' => Resident::factory()->create()->id]);

    $this->withToken($token)
        ->getJson("/api/houses/{$house->id}/residents")
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

// ── POST /api/houses/{house}/residents ────────────────────────────────────────

test('dapat assign penghuni ke rumah', function () {
    $token = makeAdminToken();
    $house = House::factory()->create();
    $resident = Resident::factory()->create();

    $this->withToken($token)
        ->postJson("/api/houses/{$house->id}/residents", [
            'resident_id' => $resident->id,
            'moved_in_at' => '2024-01-01',
        ])
        ->assertStatus(201)
        ->assertJsonFragment(['resident_id' => $resident->id, 'is_active' => true])
        ->assertJsonStructure(['message', 'data' => ['id', 'house_id', 'resident_id', 'moved_in_at', 'is_active']]);

    // status rumah berubah jadi occupied
    expect($house->fresh()->status)->toBe('occupied');
});

test('status rumah berubah jadi occupied setelah penghuni di-assign', function () {
    $token = makeAdminToken();
    $house = House::factory()->create(['status' => 'unoccupied']);
    $resident = Resident::factory()->create();

    $this->withToken($token)
        ->postJson("/api/houses/{$house->id}/residents", [
            'resident_id' => $resident->id,
            'moved_in_at' => '2024-01-01',
        ])
        ->assertStatus(201);

    expect($house->fresh()->status)->toBe('occupied');
});

test('gagal assign jika penghuni sudah aktif di rumah lain', function () {
    $token = makeAdminToken();
    $house1 = House::factory()->create();
    $house2 = House::factory()->create();
    $resident = Resident::factory()->create();

    HouseResident::factory()->create([
        'house_id'    => $house1->id,
        'resident_id' => $resident->id,
        'is_active'   => true,
    ]);

    $this->withToken($token)
        ->postJson("/api/houses/{$house2->id}/residents", [
            'resident_id' => $resident->id,
            'moved_in_at' => '2024-06-01',
        ])
        ->assertStatus(422)
        ->assertJsonFragment(['message' => 'Penghuni ini sudah menghuni rumah lain']);
});

test('gagal assign jika resident_id tidak ada', function () {
    $token = makeAdminToken();
    $house = House::factory()->create();

    $this->withToken($token)
        ->postJson("/api/houses/{$house->id}/residents", [
            'resident_id' => 9999,
            'moved_in_at' => '2024-01-01',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['resident_id']);
});

test('gagal assign jika moved_in_at di masa depan', function () {
    $token = makeAdminToken();
    $house = House::factory()->create();
    $resident = Resident::factory()->create();

    $this->withToken($token)
        ->postJson("/api/houses/{$house->id}/residents", [
            'resident_id' => $resident->id,
            'moved_in_at' => now()->addDays(5)->toDateString(),
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['moved_in_at']);
});

// ── PUT /api/houses/{house}/residents/{id}/checkout ──────────────────────────

test('dapat checkout penghuni dari rumah', function () {
    $token = makeAdminToken();
    $house = House::factory()->create(['status' => 'occupied']);
    $resident = Resident::factory()->create();

    $hr = HouseResident::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'moved_in_at' => '2024-01-01',
        'is_active'   => true,
    ]);

    $this->withToken($token)
        ->putJson("/api/houses/{$house->id}/residents/{$hr->id}/checkout", [
            'moved_out_at' => '2024-06-30',
            'notes'        => 'Pindah domisili',
        ])
        ->assertOk()
        ->assertJsonFragment(['is_active' => false, 'moved_out_at' => '2024-06-30'])
        ->assertJsonStructure(['message', 'data' => ['id', 'moved_in_at', 'moved_out_at', 'is_active']]);

    expect($house->fresh()->status)->toBe('unoccupied');
});

test('status rumah tetap occupied jika masih ada penghuni aktif lain', function () {
    $token = makeAdminToken();
    $house = House::factory()->create(['status' => 'occupied']);

    $hr1 = HouseResident::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => Resident::factory()->create()->id,
        'moved_in_at' => '2024-01-01',
        'is_active'   => true,
    ]);

    HouseResident::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => Resident::factory()->create()->id,
        'moved_in_at' => '2024-01-01',
        'is_active'   => true,
    ]);

    $this->withToken($token)
        ->putJson("/api/houses/{$house->id}/residents/{$hr1->id}/checkout", [
            'moved_out_at' => '2024-06-30',
        ])
        ->assertOk();

    expect($house->fresh()->status)->toBe('occupied');
});

test('gagal checkout jika moved_out_at sebelum moved_in_at', function () {
    $token = makeAdminToken();
    $house = House::factory()->create();
    $resident = Resident::factory()->create();

    $hr = HouseResident::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'moved_in_at' => '2024-06-01',
        'is_active'   => true,
    ]);

    $this->withToken($token)
        ->putJson("/api/houses/{$house->id}/residents/{$hr->id}/checkout", [
            'moved_out_at' => '2024-01-01',
        ])
        ->assertStatus(422);
});

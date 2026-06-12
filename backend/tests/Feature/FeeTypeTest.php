<?php

use App\Models\FeeType;

// ── GET /api/fee-types ────────────────────────────────────────────────────────

test('unauthenticated user tidak bisa akses jenis iuran', function () {
    $this->getJson('/api/fee-types')
        ->assertStatus(401);
});

test('dapat mengambil daftar jenis iuran', function () {
    $token = makeAdminToken();
    FeeType::factory()->count(3)->create();

    $this->withToken($token)
        ->getJson('/api/fee-types')
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure(['data' => [['id', 'name', 'amount', 'description']]]);
});

// ── POST /api/fee-types ───────────────────────────────────────────────────────

test('dapat menambah jenis iuran baru', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->postJson('/api/fee-types', [
            'name'        => 'Iuran Satpam',
            'amount'      => 100000,
            'description' => 'Iuran untuk gaji satpam',
        ])
        ->assertStatus(201)
        ->assertJsonPath('data.name', 'Iuran Satpam')
        ->assertJsonPath('data.amount', 100000)
        ->assertJsonStructure(['message', 'data' => ['id', 'name', 'amount', 'description']]);

    $this->assertDatabaseHas('fee_types', ['name' => 'Iuran Satpam', 'amount' => 100000]);
});

test('gagal tambah jenis iuran jika name kosong', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->postJson('/api/fee-types', ['amount' => 100000])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('gagal tambah jenis iuran jika amount tidak valid', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->postJson('/api/fee-types', ['name' => 'Test', 'amount' => 0])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['amount']);
});

test('gagal tambah jenis iuran jika name duplikat', function () {
    $token = makeAdminToken();
    FeeType::factory()->create(['name' => 'Iuran Duplikat']);

    $this->withToken($token)
        ->postJson('/api/fee-types', ['name' => 'Iuran Duplikat', 'amount' => 50000])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

// ── PUT /api/fee-types/{id} ───────────────────────────────────────────────────

test('dapat mengubah jenis iuran', function () {
    $token = makeAdminToken();
    $feeType = FeeType::factory()->create(['name' => 'Iuran Lama', 'amount' => 50000]);

    $this->withToken($token)
        ->putJson("/api/fee-types/{$feeType->id}", [
            'name'   => 'Iuran Baru',
            'amount' => 120000,
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Iuran Baru')
        ->assertJsonPath('data.amount', 120000)
        ->assertJsonStructure(['message', 'data']);

    $this->assertDatabaseHas('fee_types', ['id' => $feeType->id, 'name' => 'Iuran Baru']);
});

test('edit jenis iuran boleh pakai nama miliknya sendiri', function () {
    $token = makeAdminToken();
    $feeType = FeeType::factory()->create(['name' => 'Iuran Satpam']);

    $this->withToken($token)
        ->putJson("/api/fee-types/{$feeType->id}", [
            'name'   => 'Iuran Satpam',
            'amount' => 120000,
        ])
        ->assertOk();
});

test('edit jenis iuran gagal jika name milik jenis lain', function () {
    $token = makeAdminToken();
    FeeType::factory()->create(['name' => 'Iuran Kebersihan']);
    $feeType = FeeType::factory()->create(['name' => 'Iuran Satpam']);

    $this->withToken($token)
        ->putJson("/api/fee-types/{$feeType->id}", [
            'name'   => 'Iuran Kebersihan',
            'amount' => 100000,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

// ── DELETE /api/fee-types/{id} ────────────────────────────────────────────────

test('dapat menghapus jenis iuran yang belum dipakai', function () {
    $token = makeAdminToken();
    $feeType = FeeType::factory()->create();

    $this->withToken($token)
        ->deleteJson("/api/fee-types/{$feeType->id}")
        ->assertOk()
        ->assertJsonFragment(['message' => 'Jenis iuran berhasil dihapus']);

    $this->assertDatabaseMissing('fee_types', ['id' => $feeType->id]);
});

test('hapus jenis iuran yang tidak ada mengembalikan 404', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->deleteJson('/api/fee-types/9999')
        ->assertStatus(404);
});

<?php

use App\Models\Expense;

// ── GET /api/expenses ──────────────────────────────────────────────────────────

test('unauthenticated user tidak bisa akses pengeluaran', function () {
    $this->getJson('/api/expenses')->assertStatus(401);
});

test('dapat mengambil daftar pengeluaran', function () {
    $token = makeAdminToken();
    Expense::factory()->count(3)->create();

    $this->withToken($token)
        ->getJson('/api/expenses')
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure(['data', 'meta' => ['total', 'total_amount']]);
});

test('dapat filter pengeluaran berdasarkan kategori', function () {
    $token = makeAdminToken();
    Expense::factory()->count(2)->create(['category' => 'Gaji']);
    Expense::factory()->create(['category' => 'Listrik']);

    $this->withToken($token)
        ->getJson('/api/expenses?category=Gaji')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

test('dapat filter pengeluaran berdasarkan tahun dan bulan', function () {
    $token = makeAdminToken();
    Expense::factory()->create(['expense_date' => '2024-06-01']);
    Expense::factory()->create(['expense_date' => '2024-07-01']);

    $this->withToken($token)
        ->getJson('/api/expenses?year=2024&month=6')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('dapat search pengeluaran berdasarkan keterangan', function () {
    $token = makeAdminToken();
    Expense::factory()->create(['description' => 'Gaji satpam bulan Juni']);
    Expense::factory()->create(['description' => 'Token listrik pos satpam']);

    $this->withToken($token)
        ->getJson('/api/expenses?search=satpam+bulan')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

// ── POST /api/expenses ─────────────────────────────────────────────────────────

test('dapat menambah pengeluaran baru', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->postJson('/api/expenses', [
            'category'     => 'Infrastruktur',
            'description'  => 'Perbaikan jalan blok A',
            'amount'       => 800000,
            'expense_date' => '2024-06-15',
            'notes'        => 'Aspal retak depan A3',
        ])
        ->assertStatus(201)
        ->assertJsonPath('data.category', 'Infrastruktur')
        ->assertJsonPath('data.amount', 800000)
        ->assertJsonStructure(['message', 'data' => ['id', 'category', 'description', 'amount', 'expense_date']]);

    $this->assertDatabaseHas('expenses', ['description' => 'Perbaikan jalan blok A', 'amount' => 800000]);
});

test('gagal tambah pengeluaran jika category kosong', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->postJson('/api/expenses', [
            'description'  => 'Test',
            'amount'       => 100000,
            'expense_date' => '2024-06-01',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['category']);
});

test('gagal tambah pengeluaran jika amount nol atau negatif', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->postJson('/api/expenses', [
            'category'     => 'Gaji',
            'description'  => 'Test',
            'amount'       => 0,
            'expense_date' => '2024-06-01',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['amount']);
});

test('gagal tambah pengeluaran jika expense_date tidak valid', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->postJson('/api/expenses', [
            'category'     => 'Gaji',
            'description'  => 'Test',
            'amount'       => 100000,
            'expense_date' => 'bukan-tanggal',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['expense_date']);
});

// ── GET /api/expenses/{id} ─────────────────────────────────────────────────────

test('dapat mengambil detail pengeluaran', function () {
    $token   = makeAdminToken();
    $expense = Expense::factory()->create();

    $this->withToken($token)
        ->getJson("/api/expenses/{$expense->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $expense->id)
        ->assertJsonStructure(['data' => ['id', 'category', 'description', 'amount', 'expense_date']]);
});

test('detail pengeluaran yang tidak ada mengembalikan 404', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->getJson('/api/expenses/9999')
        ->assertStatus(404);
});

// ── PUT /api/expenses/{id} ─────────────────────────────────────────────────────

test('dapat mengubah pengeluaran', function () {
    $token   = makeAdminToken();
    $expense = Expense::factory()->create(['amount' => 500000]);

    $this->withToken($token)
        ->putJson("/api/expenses/{$expense->id}", [
            'category'     => 'Infrastruktur',
            'description'  => 'Perbaikan selokan diperbarui',
            'amount'       => 950000,
            'expense_date' => '2024-06-15',
        ])
        ->assertOk()
        ->assertJsonPath('data.amount', 950000)
        ->assertJsonStructure(['message', 'data']);

    $this->assertDatabaseHas('expenses', ['id' => $expense->id, 'amount' => 950000]);
});

// ── DELETE /api/expenses/{id} ──────────────────────────────────────────────────

test('dapat menghapus pengeluaran', function () {
    $token   = makeAdminToken();
    $expense = Expense::factory()->create();

    $this->withToken($token)
        ->deleteJson("/api/expenses/{$expense->id}")
        ->assertOk()
        ->assertJsonFragment(['message' => 'Pengeluaran berhasil dihapus']);

    $this->assertDatabaseMissing('expenses', ['id' => $expense->id]);
});

test('hapus pengeluaran yang tidak ada mengembalikan 404', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->deleteJson('/api/expenses/9999')
        ->assertStatus(404);
});

<?php

use App\Models\User;

// ── GET /api/users ─────────────────────────────────────────────────────────────

test('unauthenticated user tidak bisa akses daftar user', function () {
    $this->getJson('/api/users')->assertStatus(401);
});

test('super_admin dapat mengambil daftar user', function () {
    $token = makeSuperAdminToken();
    User::factory()->count(2)->create(['role' => 'admin']);

    $this->withToken($token)
        ->getJson('/api/users')
        ->assertOk()
        ->assertJsonStructure(['data' => [['id', 'name', 'email', 'role']]]);
});

test('admin biasa tidak bisa akses daftar user (403)', function () {
    $token = makeAdminOnlyToken();

    $this->withToken($token)
        ->getJson('/api/users')
        ->assertStatus(403);
});

test('resident tidak bisa akses daftar user (403)', function () {
    [$token] = makeResidentToken();

    $this->withToken($token)
        ->getJson('/api/users')
        ->assertStatus(403);
});

// ── POST /api/users ────────────────────────────────────────────────────────────

test('super_admin dapat membuat user admin baru', function () {
    $token = makeSuperAdminToken();

    $this->withToken($token)
        ->postJson('/api/users', [
            'name'     => 'Petugas Baru',
            'email'    => 'petugas@test.com',
            'password' => 'password123',
            'role'     => 'admin',
        ])
        ->assertStatus(201)
        ->assertJsonPath('data.role', 'admin')
        ->assertJsonStructure(['message', 'data' => ['id', 'name', 'email', 'role']]);

    $this->assertDatabaseHas('users', ['email' => 'petugas@test.com', 'role' => 'admin']);
});

test('gagal buat user jika email duplikat', function () {
    $token = makeSuperAdminToken();
    User::factory()->create(['email' => 'existing@test.com']);

    $this->withToken($token)
        ->postJson('/api/users', [
            'name'     => 'Test',
            'email'    => 'existing@test.com',
            'password' => 'password123',
            'role'     => 'admin',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('gagal buat user dengan role resident via endpoint ini', function () {
    $token = makeSuperAdminToken();

    $this->withToken($token)
        ->postJson('/api/users', [
            'name'     => 'Test',
            'email'    => 'test@test.com',
            'password' => 'password123',
            'role'     => 'resident',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['role']);
});

test('admin biasa tidak bisa membuat user baru (403)', function () {
    $token = makeAdminOnlyToken();

    $this->withToken($token)
        ->postJson('/api/users', [
            'name'     => 'Test',
            'email'    => 'test@test.com',
            'password' => 'password123',
            'role'     => 'admin',
        ])
        ->assertStatus(403);
});

// ── PUT /api/users/{id} ────────────────────────────────────────────────────────

test('super_admin dapat update role user', function () {
    $token = makeSuperAdminToken();
    $user = User::factory()->create(['role' => 'admin']);

    $this->withToken($token)
        ->putJson("/api/users/{$user->id}", ['role' => 'super_admin'])
        ->assertOk()
        ->assertJsonPath('data.role', 'super_admin');

    $this->assertDatabaseHas('users', ['id' => $user->id, 'role' => 'super_admin']);
});

test('super_admin dapat reset password user', function () {
    $token = makeSuperAdminToken();
    $user = User::factory()->create(['role' => 'admin']);
    $user->createToken('old-session');

    $this->withToken($token)
        ->putJson("/api/users/{$user->id}", ['password' => 'newpassword123'])
        ->assertOk();

    // semua token lama harus terhapus setelah reset password
    $this->assertDatabaseCount('personal_access_tokens', 1); // hanya token super_admin yang aktif
});

test('admin biasa tidak bisa update user (403)', function () {
    $token = makeAdminOnlyToken();
    $user = User::factory()->create(['role' => 'admin']);

    $this->withToken($token)
        ->putJson("/api/users/{$user->id}", ['role' => 'admin'])
        ->assertStatus(403);
});

// ── DELETE /api/users/{id} ─────────────────────────────────────────────────────

test('super_admin dapat menghapus user lain', function () {
    $token = makeSuperAdminToken();
    $user = User::factory()->create(['role' => 'admin']);

    $this->withToken($token)
        ->deleteJson("/api/users/{$user->id}")
        ->assertOk()
        ->assertJsonFragment(['message' => 'User berhasil dihapus']);

    $this->assertDatabaseMissing('users', ['id' => $user->id]);
});

test('super_admin tidak bisa hapus akunnya sendiri (422)', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $token = $superAdmin->createToken('test')->plainTextToken;

    $this->withToken($token)
        ->deleteJson("/api/users/{$superAdmin->id}")
        ->assertStatus(422)
        ->assertJsonFragment(['message' => 'Tidak bisa menghapus akun sendiri']);
});

test('admin biasa tidak bisa hapus user (403)', function () {
    $token = makeAdminOnlyToken();
    $user = User::factory()->create(['role' => 'admin']);

    $this->withToken($token)
        ->deleteJson("/api/users/{$user->id}")
        ->assertStatus(403);
});

<?php

use App\Models\Resident;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

// helper: buat user dan kembalikan token sanctum
function adminToken(): string
{
    $user = User::factory()->create();
    return $user->createToken('test')->plainTextToken;
}

// helper: payload resident valid
function residentPayload(array $overrides = []): array
{
    return array_merge([
        'full_name'     => 'Budi Santoso',
        'phone'         => '08123456789',
        'resident_type' => 'permanent',
        'is_married'    => true,
    ], $overrides);
}

// ── GET /api/residents ────────────────────────────────────────────────────────

test('unauthenticated user cannot access residents', function () {
    $this->getJson('/api/residents')
        ->assertStatus(401);
});

test('dapat mengambil daftar penghuni', function () {
    $token = adminToken();
    Resident::factory()->count(3)->create();

    $this->withToken($token)
        ->getJson('/api/residents')
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure(['data', 'meta' => ['total', 'permanent', 'contract']]);
});

test('dapat filter penghuni berdasarkan resident_type', function () {
    $token = adminToken();
    Resident::factory()->count(2)->create(['resident_type' => 'permanent']);
    Resident::factory()->count(1)->create(['resident_type' => 'contract']);

    $this->withToken($token)
        ->getJson('/api/residents?resident_type=permanent')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

test('dapat search penghuni berdasarkan nama', function () {
    $token = adminToken();
    Resident::factory()->create(['full_name' => 'Budi Cari Ini']);
    Resident::factory()->create(['full_name' => 'Siti Bukan Ini']);

    $this->withToken($token)
        ->getJson('/api/residents?search=Cari')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.full_name', 'Budi Cari Ini');
});

// ── POST /api/residents ───────────────────────────────────────────────────────

test('dapat menambah penghuni baru', function () {
    $token = adminToken();

    $this->withToken($token)
        ->postJson('/api/residents', residentPayload())
        ->assertStatus(201)
        ->assertJsonFragment(['full_name' => 'Budi Santoso', 'phone' => '08123456789'])
        ->assertJsonStructure(['message', 'data' => ['id', 'full_name', 'phone', 'ktp_photo_url', 'current_house']]);

    $this->assertDatabaseHas('residents', ['phone' => '08123456789']);
});

test('dapat menambah penghuni dengan upload foto KTP', function () {
    Storage::fake('public');
    $token = adminToken();

    $file = UploadedFile::fake()->image('ktp.jpg', 800, 500);

    $response = $this->withToken($token)
        ->postJson('/api/residents', array_merge(residentPayload(), ['ktp_photo' => $file]))
        ->assertStatus(201)
        ->assertJsonStructure(['data' => ['ktp_photo_url']]);

    // ambil path dari URL yang dikembalikan
    $ktpUrl = $response->json('data.ktp_photo_url');
    $ktpPath = ltrim(parse_url($ktpUrl, PHP_URL_PATH), '/storage/');
    Storage::disk('public')->assertExists($ktpPath);
});

test('gagal tambah penghuni jika full_name kosong', function () {
    $token = adminToken();

    $this->withToken($token)
        ->postJson('/api/residents', residentPayload(['full_name' => '']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['full_name']);
});

test('gagal tambah penghuni jika phone duplikat', function () {
    $token = adminToken();
    Resident::factory()->create(['phone' => '08111111111']);

    $this->withToken($token)
        ->postJson('/api/residents', residentPayload(['phone' => '08111111111']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['phone']);
});

test('gagal tambah penghuni jika resident_type tidak valid', function () {
    $token = adminToken();

    $this->withToken($token)
        ->postJson('/api/residents', residentPayload(['resident_type' => 'vip']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['resident_type']);
});

test('gagal tambah penghuni jika ktp_photo bukan gambar', function () {
    Storage::fake('public');
    $token = adminToken();

    $file = UploadedFile::fake()->create('dokumen.pdf', 500, 'application/pdf');

    $this->withToken($token)
        ->postJson('/api/residents', array_merge(residentPayload(), ['ktp_photo' => $file]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['ktp_photo']);
});

// ── GET /api/residents/{id} ───────────────────────────────────────────────────

test('dapat mengambil detail penghuni', function () {
    $token = adminToken();
    $resident = Resident::factory()->create();

    $this->withToken($token)
        ->getJson("/api/residents/{$resident->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $resident->id)
        ->assertJsonStructure(['data' => [
            'id', 'full_name', 'phone', 'ktp_photo_url',
            'current_house', 'house_history', 'payment_summary',
        ]]);
});

test('detail penghuni yang tidak ada mengembalikan 404', function () {
    $token = adminToken();

    $this->withToken($token)
        ->getJson('/api/residents/9999')
        ->assertStatus(404);
});

// ── PUT /api/residents/{id} ───────────────────────────────────────────────────

test('dapat mengubah data penghuni', function () {
    $token = adminToken();
    $resident = Resident::factory()->create(['full_name' => 'Nama Lama']);

    $this->withToken($token)
        ->putJson("/api/residents/{$resident->id}", residentPayload([
            'full_name' => 'Nama Baru',
            'phone'     => $resident->phone,
        ]))
        ->assertOk()
        ->assertJsonPath('data.full_name', 'Nama Baru')
        ->assertJsonStructure(['message', 'data' => ['id', 'full_name', 'ktp_photo_url', 'updated_at']]);

    $this->assertDatabaseHas('residents', ['full_name' => 'Nama Baru']);
});

test('edit penghuni boleh pakai phone miliknya sendiri', function () {
    $token = adminToken();
    $resident = Resident::factory()->create(['phone' => '08199999999']);

    $this->withToken($token)
        ->putJson("/api/residents/{$resident->id}", residentPayload(['phone' => '08199999999']))
        ->assertOk()
        ->assertJsonStructure(['message', 'data']);
});

test('edit penghuni gagal jika phone milik penghuni lain', function () {
    $token = adminToken();
    Resident::factory()->create(['phone' => '08100000000']);
    $resident = Resident::factory()->create(['phone' => '08200000000']);

    $this->withToken($token)
        ->putJson("/api/residents/{$resident->id}", residentPayload(['phone' => '08100000000']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['phone']);
});

// ── DELETE /api/residents/{id} ────────────────────────────────────────────────

test('dapat menghapus penghuni yang tidak aktif', function () {
    $token = adminToken();
    $resident = Resident::factory()->create();

    $this->withToken($token)
        ->deleteJson("/api/residents/{$resident->id}")
        ->assertOk()
        ->assertJsonFragment(['message' => 'Penghuni berhasil dihapus.']);

    $this->assertDatabaseMissing('residents', ['id' => $resident->id]);
});

test('hapus penghuni juga menghapus foto KTP dari storage', function () {
    Storage::fake('public');
    $token = adminToken();

    Storage::disk('public')->put('ktp/foto-test.jpg', 'dummy');
    $resident = Resident::factory()->create(['ktp_photo' => 'ktp/foto-test.jpg']);

    $this->withToken($token)
        ->deleteJson("/api/residents/{$resident->id}")
        ->assertOk();

    Storage::disk('public')->assertMissing('ktp/foto-test.jpg');
});

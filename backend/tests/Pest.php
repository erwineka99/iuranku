<?php

use App\Models\Resident;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

// super_admin — akses penuh ke semua endpoint admin
function makeAdminToken(): string
{
    $user = User::factory()->create(['role' => 'super_admin']);
    return $user->createToken('test')->plainTextToken;
}

// alias eksplisit untuk super_admin
function makeSuperAdminToken(): string
{
    return makeAdminToken();
}

// admin biasa — akses terbatas (tidak bisa DELETE bill/payment/expense/fee-type, tidak bisa kelola users)
function makeAdminOnlyToken(): string
{
    $user = User::factory()->create(['role' => 'admin']);
    return $user->createToken('test')->plainTextToken;
}

// resident — hanya akses /api/resident/*
function makeResidentToken(?Resident $resident = null): array
{
    $resident ??= Resident::factory()->create();
    $user = User::factory()->create([
        'role'        => 'resident',
        'resident_id' => $resident->id,
        'email'       => $resident->phone . '@iuranku.com',
    ]);
    $token = $user->createToken('test')->plainTextToken;
    return [$token, $resident, $user];
}

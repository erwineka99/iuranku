<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

// helper global untuk semua test
function makeAdminToken(): string
{
    $user = User::factory()->create();
    return $user->createToken('test')->plainTextToken;
}

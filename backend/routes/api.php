<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HouseController;
use App\Http\Controllers\Api\ResidentController;
use Illuminate\Support\Facades\Route;

// endpoint cek apakah server jalan
Route::get('/ping', fn () => response()->json(['message' => 'pong']));

// auth — tidak perlu login dulu
Route::post('/auth/login', [AuthController::class, 'login']);

// endpoint yang butuh login
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // modul rumah
    Route::apiResource('houses', HouseController::class);

    // modul penghuni
    Route::apiResource('residents', ResidentController::class);
});

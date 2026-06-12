<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FeeTypeController;
use App\Http\Controllers\Api\HouseController;
use App\Http\Controllers\Api\HouseResidentController;
use App\Http\Controllers\Api\PaymentController;
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

    // modul riwayat penghuni rumah
    Route::get('houses/{house}/residents', [HouseResidentController::class, 'index']);
    Route::post('houses/{house}/residents', [HouseResidentController::class, 'store']);
    Route::put('houses/{house}/residents/{houseResident}/checkout', [HouseResidentController::class, 'checkout']);

    // modul jenis iuran
    Route::apiResource('fee-types', FeeTypeController::class)->except(['show']);

    // modul tagihan — generate harus didaftarkan sebelum apiResource agar tidak bertabrakan dengan {bill}
    Route::post('bills/generate', [BillController::class, 'generate']);
    Route::apiResource('bills', BillController::class)->except(['update']);

    // modul pembayaran
    Route::apiResource('payments', PaymentController::class)->except(['update']);

    // modul pengeluaran
    Route::apiResource('expenses', ExpenseController::class);
});

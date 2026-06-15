<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FeeTypeController;
use App\Http\Controllers\Api\HouseController;
use App\Http\Controllers\Api\HouseResidentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PrepaymentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ResidentController;
use App\Http\Controllers\Api\ResidentPortalController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// endpoint cek apakah server jalan
Route::get('/ping', fn () => response()->json(['message' => 'pong']));

// auth — tidak perlu login dulu
Route::post('/auth/login', [AuthController::class, 'login']);

// endpoint yang butuh login
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // --- portal penghuni (hanya role resident) ---
    Route::middleware('role:resident')->prefix('resident')->group(function () {
        Route::get('/dashboard',    [ResidentPortalController::class, 'dashboard']);
        Route::get('/bills',        [ResidentPortalController::class, 'bills']);
        Route::get('/payments',     [ResidentPortalController::class, 'payments']);
        Route::get('/prepayments',  [ResidentPortalController::class, 'prepayments']);
        Route::get('/expenses',     [ResidentPortalController::class, 'expenses']);
    });

    // --- endpoint admin & super_admin ---
    Route::middleware('role:super_admin,admin')->group(function () {

        // modul rumah
        Route::apiResource('houses', HouseController::class);

        // modul penghuni
        Route::apiResource('residents', ResidentController::class);

        // modul riwayat penghuni rumah
        Route::get('houses/{house}/residents',                               [HouseResidentController::class, 'index']);
        Route::post('houses/{house}/residents',                              [HouseResidentController::class, 'store']);
        Route::put('houses/{house}/residents/{houseResident}/checkout',      [HouseResidentController::class, 'checkout']);

        // modul jenis iuran — hanya super_admin yang bisa mengubah
        Route::get('fee-types',          [FeeTypeController::class, 'index']);
        Route::middleware('role:super_admin')->group(function () {
            Route::post('fee-types',         [FeeTypeController::class, 'store']);
            Route::put('fee-types/{feeType}', [FeeTypeController::class, 'update']);
            Route::delete('fee-types/{feeType}', [FeeTypeController::class, 'destroy']);
        });

        // modul tagihan — generate & tambah manual boleh admin, hapus hanya super_admin
        Route::post('bills/generate',                    [BillController::class, 'generate']);
        Route::get('bills',                              [BillController::class, 'index']);
        Route::post('bills',                             [BillController::class, 'store']);
        Route::get('bills/{bill}',                       [BillController::class, 'show']);
        Route::post('bills/{bill}/apply-prepayment',     [BillController::class, 'applyPrepayment']);
        Route::middleware('role:super_admin')->group(function () {
            Route::delete('bills/{bill}', [BillController::class, 'destroy']);
        });

        // modul pembayaran — catat boleh admin, hapus hanya super_admin
        Route::get('payments',         [PaymentController::class, 'index']);
        Route::post('payments',        [PaymentController::class, 'store']);
        Route::get('payments/{payment}', [PaymentController::class, 'show']);
        Route::middleware('role:super_admin')->group(function () {
            Route::delete('payments/{payment}', [PaymentController::class, 'destroy']);
        });

        // modul pengeluaran — CRUD boleh admin, hapus hanya super_admin
        Route::get('expenses',           [ExpenseController::class, 'index']);
        Route::post('expenses',          [ExpenseController::class, 'store']);
        Route::get('expenses/{expense}', [ExpenseController::class, 'show']);
        Route::put('expenses/{expense}', [ExpenseController::class, 'update']);
        Route::middleware('role:super_admin')->group(function () {
            Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy']);
        });

        // modul pembayaran dimuka (prepayment)
        Route::get('prepayments',              [PrepaymentController::class, 'index']);
        Route::get('prepayments/summary',      [PrepaymentController::class, 'summary']);
        Route::post('prepayments',             [PrepaymentController::class, 'store']);
        Route::get('prepayments/{prepayment}', [PrepaymentController::class, 'show']);
        Route::middleware('role:super_admin')->group(function () {
            Route::delete('prepayments/{prepayment}', [PrepaymentController::class, 'destroy']);
        });

        // modul laporan
        Route::get('reports/dashboard', [ReportController::class, 'dashboard']);
        Route::get('reports/summary',   [ReportController::class, 'summary']);
        Route::get('reports/monthly',   [ReportController::class, 'monthly']);
    });

    // --- user management (hanya super_admin) ---
    Route::middleware('role:super_admin')->group(function () {
        Route::get('users',         [UserController::class, 'index']);
        Route::post('users',        [UserController::class, 'store']);
        Route::put('users/{user}',  [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);
    });
});

<?php

use App\Models\Bill;
use App\Models\Expense;
use App\Models\FeeType;
use App\Models\House;
use App\Models\HouseResident;
use App\Models\Payment;
use App\Models\PaymentItem;
use App\Models\Resident;

// helper: setup data lengkap untuk laporan
function setupReportData(int $year, int $month): array
{
    $house    = House::factory()->create(['status' => 'occupied']);
    $resident = Resident::factory()->create();
    HouseResident::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'is_active'   => true,
    ]);
    $feeType = FeeType::factory()->create(['amount' => 100000]);

    // tagihan bulan ini
    $bill = Bill::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'fee_type_id' => $feeType->id,
        'year'        => $year,
        'month'       => $month,
        'amount'      => 100000,
        'status'      => 'paid',
    ]);

    // pembayaran
    $payment = Payment::factory()->create([
        'resident_id'  => $resident->id,
        'paid_at'      => "{$year}-{$month}-05",
        'total_amount' => 100000,
    ]);
    PaymentItem::create(['payment_id' => $payment->id, 'bill_id' => $bill->id, 'amount' => 100000]);

    // pengeluaran bulan ini
    $expense = Expense::factory()->create([
        'category'     => 'Gaji',
        'amount'       => 1500000,
        'expense_date' => "{$year}-{$month}-01",
    ]);

    return [$house, $resident, $bill, $payment, $expense];
}

// ── GET /api/reports/dashboard ─────────────────────────────────────────────────

test('unauthenticated user tidak bisa akses laporan', function () {
    $this->getJson('/api/reports/dashboard')->assertStatus(401);
});

test('dashboard mengembalikan struktur data yang benar', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->getJson('/api/reports/dashboard')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'houses'    => ['total', 'occupied', 'unoccupied'],
                'residents' => ['total', 'permanent', 'contract'],
                'current_month' => ['label', 'income', 'expense', 'balance', 'bills'],
                'unpaid_bills_by_house',
            ],
        ]);
});

test('dashboard menghitung jumlah rumah dan penghuni dengan benar', function () {
    $token = makeAdminToken();
    House::factory()->count(3)->create(['status' => 'occupied']);
    House::factory()->count(2)->create(['status' => 'unoccupied']);
    Resident::factory()->count(4)->create(['resident_type' => 'permanent']);
    Resident::factory()->count(1)->create(['resident_type' => 'contract']);

    $this->withToken($token)
        ->getJson('/api/reports/dashboard')
        ->assertOk()
        ->assertJsonPath('data.houses.total', 5)
        ->assertJsonPath('data.houses.occupied', 3)
        ->assertJsonPath('data.houses.unoccupied', 2)
        ->assertJsonPath('data.residents.total', 5)
        ->assertJsonPath('data.residents.permanent', 4)
        ->assertJsonPath('data.residents.contract', 1);
});

test('dashboard menampilkan rumah dengan tagihan belum lunas bulan ini', function () {
    $token = makeAdminToken();
    $now   = now();

    $house    = House::factory()->create(['status' => 'occupied']);
    $resident = Resident::factory()->create();
    HouseResident::factory()->create(['house_id' => $house->id, 'resident_id' => $resident->id, 'is_active' => true]);
    $feeType = FeeType::factory()->create();

    Bill::factory()->create([
        'house_id'    => $house->id,
        'resident_id' => $resident->id,
        'fee_type_id' => $feeType->id,
        'year'        => $now->year,
        'month'       => $now->month,
        'status'      => 'unpaid',
    ]);

    $response = $this->withToken($token)
        ->getJson('/api/reports/dashboard')
        ->assertOk();

    expect($response->json('data.unpaid_bills_by_house'))->toHaveCount(1);
    expect($response->json('data.unpaid_bills_by_house.0.house_id'))->toBe($house->id);
});

// ── GET /api/reports/summary ───────────────────────────────────────────────────

test('summary gagal jika year tidak disertakan', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->getJson('/api/reports/summary')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['year']);
});

test('summary mengembalikan 12 bulan data', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->getJson('/api/reports/summary?year=2024')
        ->assertOk()
        ->assertJsonCount(12, 'data.months')
        ->assertJsonStructure([
            'data' => [
                'year',
                'months' => [['month', 'month_label', 'income', 'expense', 'balance']],
                'annual_summary' => ['total_income', 'total_expense', 'total_balance'],
            ],
        ]);
});

test('summary menghitung income dan expense per bulan dengan benar', function () {
    $token = makeAdminToken();
    setupReportData(2024, 6);

    $response = $this->withToken($token)
        ->getJson('/api/reports/summary?year=2024')
        ->assertOk();

    // bulan ke-6 (index 5) harus punya income 100000 dan expense 1500000
    $june = collect($response->json('data.months'))->firstWhere('month', 6);
    expect($june['income'])->toBe(100000);
    expect($june['expense'])->toBe(1500000);
    expect($june['balance'])->toBe(-1400000);
});

test('summary annual_summary menjumlahkan semua bulan', function () {
    $token = makeAdminToken();
    setupReportData(2024, 6);
    setupReportData(2024, 7);

    $response = $this->withToken($token)
        ->getJson('/api/reports/summary?year=2024')
        ->assertOk();

    $annual = $response->json('data.annual_summary');
    expect($annual['total_income'])->toBe(200000);
    expect($annual['total_expense'])->toBe(3000000);
    expect($annual['total_balance'])->toBe(-2800000);
});

// ── GET /api/reports/monthly ───────────────────────────────────────────────────

test('monthly gagal jika year atau month tidak disertakan', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->getJson('/api/reports/monthly?year=2024')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['month']);
});

test('monthly mengembalikan struktur data yang benar', function () {
    $token = makeAdminToken();

    $this->withToken($token)
        ->getJson('/api/reports/monthly?year=2024&month=6')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'year', 'month', 'month_label',
                'income'  => ['total', 'items'],
                'expense' => ['total', 'items'],
                'balance',
                'bill_summary' => ['total_bills', 'paid', 'unpaid', 'collection_rate'],
            ],
        ]);
});

test('monthly menghitung income, expense, dan balance dengan benar', function () {
    $token = makeAdminToken();
    setupReportData(2024, 6);

    $response = $this->withToken($token)
        ->getJson('/api/reports/monthly?year=2024&month=6')
        ->assertOk();

    expect($response->json('data.income.total'))->toBe(100000);
    expect($response->json('data.expense.total'))->toBe(1500000);
    expect($response->json('data.balance'))->toBe(-1400000);
    expect($response->json('data.income.items'))->toHaveCount(1);
    expect($response->json('data.expense.items'))->toHaveCount(1);
});

test('monthly bill_summary menghitung tagihan dengan benar', function () {
    $token = makeAdminToken();
    $house    = House::factory()->create(['status' => 'occupied']);
    $resident = Resident::factory()->create();
    HouseResident::factory()->create(['house_id' => $house->id, 'resident_id' => $resident->id, 'is_active' => true]);
    $feeType = FeeType::factory()->create();

    Bill::factory()->paid()->create(['house_id' => $house->id, 'resident_id' => $resident->id, 'fee_type_id' => $feeType->id, 'year' => 2024, 'month' => 6]);
    Bill::factory()->create(['house_id' => $house->id, 'resident_id' => $resident->id, 'fee_type_id' => $feeType->id, 'year' => 2024, 'month' => 6, 'month' => 7]);

    $response = $this->withToken($token)
        ->getJson('/api/reports/monthly?year=2024&month=6')
        ->assertOk();

    expect($response->json('data.bill_summary.total_bills'))->toBe(1);
    expect($response->json('data.bill_summary.paid'))->toBe(1);
    expect($response->json('data.bill_summary.unpaid'))->toBe(0);
    expect($response->json('data.bill_summary.collection_rate'))->toBe('100.00%');
});

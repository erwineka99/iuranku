<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prepayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'resident_id',
        'fee_type_id',
        'amount',
        'remaining_balance',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'paid_at'           => 'date',
            'amount'            => 'integer',
            'remaining_balance' => 'integer',
        ];
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    public function feeType(): BelongsTo
    {
        return $this->belongsTo(FeeType::class);
    }

    public function usages(): HasMany
    {
        return $this->hasMany(PrepaymentUsage::class);
    }
}

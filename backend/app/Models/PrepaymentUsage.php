<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrepaymentUsage extends Model
{
    protected $fillable = ['prepayment_id', 'bill_id', 'amount_used'];

    public function prepayment(): BelongsTo
    {
        return $this->belongsTo(Prepayment::class);
    }

    public function bill(): BelongsTo
    {
        return $this->belongsTo(Bill::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Resident extends Model
{
    use HasFactory;
    protected $fillable = [
        'full_name',
        'phone',
        'resident_type',
        'is_married',
        'ktp_photo',
    ];

    protected $casts = [
        'is_married' => 'boolean',
    ];

    // riwayat rumah yang pernah dihuni
    public function houseHistories(): HasMany
    {
        return $this->hasMany(HouseResident::class)->with('house')->latest('moved_in_at');
    }

    // rumah yang sedang dihuni sekarang
    public function currentHouse(): HasOne
    {
        return $this->hasOne(HouseResident::class)->where('is_active', true)->with('house');
    }
}

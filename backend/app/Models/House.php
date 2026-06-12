<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class House extends Model
{
    protected $fillable = [
        'number',
        'block',
        'address',
        'description',
        'status',
    ];

    // default status saat rumah baru dibuat selalu kosong
    protected $attributes = [
        'status' => 'unoccupied',
    ];

    // penghuni yang sedang aktif tinggal di rumah ini
    public function activeResident(): HasOne
    {
        return $this->hasOne(HouseResident::class)->where('is_active', true)->with('resident');
    }

    // semua riwayat penghuni rumah ini dari dulu sampai sekarang
    public function residentHistories(): HasMany
    {
        return $this->hasMany(HouseResident::class)->with('resident')->latest('moved_in_at');
    }
}

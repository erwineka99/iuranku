<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('houses', function (Blueprint $table) {
            $table->id();
            $table->string('number', 10);
            $table->string('block', 5);
            $table->string('address');
            $table->text('description')->nullable();
            // occupied = ada penghuni aktif, unoccupied = kosong
            $table->enum('status', ['occupied', 'unoccupied'])->default('unoccupied');
            $table->timestamps();

            // kombinasi nomor + blok harus unik supaya tidak ada duplikat rumah
            $table->unique(['number', 'block']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('houses');
    }
};

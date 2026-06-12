<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('house_residents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('house_id')->constrained()->cascadeOnDelete();
            $table->foreignId('resident_id')->constrained()->cascadeOnDelete();
            $table->date('moved_in_at');
            $table->date('moved_out_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            // satu penghuni hanya boleh aktif di satu rumah dalam satu waktu
            $table->index(['resident_id', 'is_active']);
            $table->index(['house_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('house_residents');
    }
};

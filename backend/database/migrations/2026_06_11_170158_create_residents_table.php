<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('residents', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('phone', 20)->unique();
            $table->enum('resident_type', ['permanent', 'contract']);
            $table->boolean('is_married')->default(false);
            // path relatif ke storage/app/public/ktp/
            $table->string('ktp_photo')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('residents');
    }
};

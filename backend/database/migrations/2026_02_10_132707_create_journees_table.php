<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('journees', function (Blueprint $table) {
            $table->id();
            $table->date('date_jour');
            $table->integer(('numero_jour'));
            
            $table->foreignId('voyage_id')
                    ->constrained('voyages')
                    ->cascadeOnDelete();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journees');
    }
};

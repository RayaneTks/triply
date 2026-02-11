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
        Schema::create('etapes', function (Blueprint $table) {
            $table->id();
            $table->string('temps_estime', 32);
            $table->string('titre');
            $table->text('description')->nullable();
            $table->integer('prix_estime');
            $table->string('ville')->nullable();
            $table->string('pays')->nullable();
            $table->text('source_lien')->nullable();
            
            $table->foreignId('journee_id')
                ->constrained('journees')
                ->cascadeOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('etapes');
    }
};

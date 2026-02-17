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
        Schema::create('voyages', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->string('destination');
            $table->date('date_debut');
            $table->date('date_fin');
            $table->integer('budget_total');
            $table->integer('nb_voyageurs')->default(1);
            $table->text('description')->nullable();

            $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voyages');
    }
};

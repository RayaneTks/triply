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
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        
            $table->string('titre');
            $table->string('destination');
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
        
            $table->decimal('budget_total', 10, 2)->nullable();
            $table->unsignedSmallInteger('nb_voyageurs')->default(1);
            $table->text('description')->nullable();
        
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

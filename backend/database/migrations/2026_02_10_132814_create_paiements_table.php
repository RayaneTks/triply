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
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->text('facture_stripe_id');
            $table->text('intention_paiement_stripe_id');
            $table->integer('montant');
            $table->string('statut', 64);
            $table->string('devise', 16)->nullable();
            $table->dateTime('paye_le');
            $table->dateTime('periode_debut');
            $table->dateTime('periode_fin');
            
            $table->foreignId('abonnement_id')
                ->constrained('abonnements')
                ->cascadeOnDelete();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};

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
        Schema::create('hebergements', function (Blueprint $table) {
            $table->id();
            $table->string('type', 128);
            $table->text('nom');
            $table->text('adresse');
            $table->text('code_postal')->nullable();
            $table->text('ville')->nullable();
            $table->dateTime('arrivee_le');
            $table->dateTime('depart_le');
            $table->integer('prix');
            $table->string('devise', 16)->nullable();
            $table->text('informations_supplementaire')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hebergements');
    }
};

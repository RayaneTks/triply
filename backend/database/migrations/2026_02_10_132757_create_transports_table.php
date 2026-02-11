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
        Schema::create('transports', function (Blueprint $table) {
            $table->id();
            $table->string('type', 128);
            $table->string('depart_lieu');
            $table->string('arrivee_lieu');
            $table->dateTime('depart_le');
            $table->dateTime('arrivee_le');
            $table->integer('prix');
            $table->string('devise', 16)->nullable();
            $table->text('information_supplementaire')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transports');
    }
};

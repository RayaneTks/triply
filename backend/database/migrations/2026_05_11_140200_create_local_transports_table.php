<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('local_transports')) {
            return;
        }

        Schema::create('local_transports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('voyage_id');
            $table->string('type', 50);
            $table->string('from_label', 191);
            $table->string('to_label', 191);
            $table->timestamp('departure_at')->nullable();
            $table->timestamp('arrival_at')->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->string('currency', 8)->nullable();
            $table->string('notes', 500)->nullable();
            $table->timestamps();

            $table->foreign('voyage_id')->references('id')->on('voyages')->cascadeOnDelete();
            $table->index(['voyage_id', 'departure_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('local_transports');
    }
};

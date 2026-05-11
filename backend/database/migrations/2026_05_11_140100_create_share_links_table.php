<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('share_links')) {
            return;
        }

        Schema::create('share_links', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('voyage_id');
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('voyage_id')->references('id')->on('voyages')->cascadeOnDelete();
            $table->index('expires_at', 'share_links_expires_at_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('share_links');
    }
};

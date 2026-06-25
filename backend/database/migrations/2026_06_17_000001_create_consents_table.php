<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('consents')) {
            return;
        }

        Schema::create('consents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('session_id', 100)->nullable();
            $table->boolean('analytics')->default(false);
            $table->boolean('marketing')->default(false);
            $table->boolean('functional')->default(true);
            $table->string('version', 20)->default('1.0');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique('user_id', 'consents_user_id_unique');
            $table->index('session_id', 'consents_session_id_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consents');
    }
};

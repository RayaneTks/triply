<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('etapes')) {
            return;
        }

        Schema::table('etapes', function (Blueprint $table) {
            if (! Schema::hasColumn('etapes', 'liked_state')) {
                $table->string('liked_state', 16)->default('neutral')->after('source_lien');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('etapes')) {
            return;
        }

        Schema::table('etapes', function (Blueprint $table) {
            if (Schema::hasColumn('etapes', 'liked_state')) {
                $table->dropColumn('liked_state');
            }
        });
    }
};

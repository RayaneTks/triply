<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('share_links')) {
            return;
        }

        if (Schema::hasColumn('share_links', 'password_hash')) {
            return;
        }

        Schema::table('share_links', function (Blueprint $table) {
            $table->string('password_hash')->nullable()->after('expires_at');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('share_links')) {
            return;
        }

        if (! Schema::hasColumn('share_links', 'password_hash')) {
            return;
        }

        Schema::table('share_links', function (Blueprint $table) {
            $table->dropColumn('password_hash');
        });
    }
};

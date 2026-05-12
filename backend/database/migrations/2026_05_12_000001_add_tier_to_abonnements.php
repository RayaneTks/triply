<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('abonnements')) {
            return;
        }
        Schema::table('abonnements', function (Blueprint $table) {
            if (! Schema::hasColumn('abonnements', 'tier')) {
                $table->string('tier', 32)->nullable();
            }
            if (! Schema::hasColumn('abonnements', 'plan_interval')) {
                $table->string('plan_interval', 16)->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('abonnements')) {
            return;
        }
        Schema::table('abonnements', function (Blueprint $table) {
            foreach (['tier', 'plan_interval'] as $col) {
                if (Schema::hasColumn('abonnements', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};

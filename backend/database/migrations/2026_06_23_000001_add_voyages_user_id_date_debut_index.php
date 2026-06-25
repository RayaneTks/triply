<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const VOYAGES_USER_DATE_INDEX = 'voyages_user_id_date_debut_idx';

    public function up(): void
    {
        if (! Schema::hasTable('voyages')) {
            return;
        }
        if ($this->indexExists('voyages', self::VOYAGES_USER_DATE_INDEX)) {
            return;
        }
        Schema::table('voyages', function (Blueprint $table) {
            $table->index(['user_id', 'date_debut'], self::VOYAGES_USER_DATE_INDEX);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('voyages')) {
            return;
        }
        if (! $this->indexExists('voyages', self::VOYAGES_USER_DATE_INDEX)) {
            return;
        }
        Schema::table('voyages', function (Blueprint $table) {
            $table->dropIndex(self::VOYAGES_USER_DATE_INDEX);
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            return DB::table('pg_indexes')
                ->whereRaw('schemaname = current_schema()')
                ->where('tablename', $table)
                ->where('indexname', $index)
                ->exists();
        }

        if ($driver === 'mysql') {
            return DB::table('information_schema.statistics')
                ->whereRaw('table_schema = database()')
                ->where('table_name', $table)
                ->where('index_name', $index)
                ->exists();
        }

        if ($driver === 'sqlite') {
            foreach (DB::select("PRAGMA index_list('{$table}')") as $row) {
                if (($row->name ?? null) === $index) {
                    return true;
                }
            }
        }

        return false;
    }
};

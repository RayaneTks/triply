<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const HEBERGEMENTS_VOYAGE_INDEX = 'hebergements_voyage_id_idx';
    private const TRANSPORTS_VOYAGE_INDEX = 'transports_voyage_id_idx';
    private const HEBERGEMENTS_VOYAGE_FK = 'hebergements_voyage_id_fk';
    private const TRANSPORTS_VOYAGE_FK = 'transports_voyage_id_fk';

    public function up(): void
    {
        $this->updateTable('hebergements', self::HEBERGEMENTS_VOYAGE_INDEX, self::HEBERGEMENTS_VOYAGE_FK);
        $this->updateTable('transports', self::TRANSPORTS_VOYAGE_INDEX, self::TRANSPORTS_VOYAGE_FK);
    }

    public function down(): void
    {
        $this->rollbackTable('hebergements', self::HEBERGEMENTS_VOYAGE_INDEX, self::HEBERGEMENTS_VOYAGE_FK);
        $this->rollbackTable('transports', self::TRANSPORTS_VOYAGE_INDEX, self::TRANSPORTS_VOYAGE_FK);
    }

    private function updateTable(string $tableName, string $indexName, string $foreignKeyName): void
    {
        if (! Schema::hasTable($tableName)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            if (! Schema::hasColumn($tableName, 'voyage_id')) {
                $table->unsignedBigInteger('voyage_id')->nullable();
            }
        });

        if (Schema::hasColumn($tableName, 'voyage_id') && ! $this->indexExists($tableName, $indexName)) {
            Schema::table($tableName, function (Blueprint $table) use ($indexName) {
                $table->index('voyage_id', $indexName);
            });
        }

        if (
            Schema::hasTable('voyages') &&
            Schema::hasColumn($tableName, 'voyage_id') &&
            ! $this->foreignKeyExists($tableName, $foreignKeyName)
        ) {
            Schema::table($tableName, function (Blueprint $table) use ($foreignKeyName) {
                $table->foreign('voyage_id', $foreignKeyName)
                    ->references('id')
                    ->on('voyages')
                    ->nullOnDelete();
            });
        }
    }

    private function rollbackTable(string $tableName, string $indexName, string $foreignKeyName): void
    {
        if (! Schema::hasTable($tableName)) {
            return;
        }

        if (Schema::hasColumn($tableName, 'voyage_id') && $this->foreignKeyExists($tableName, $foreignKeyName)) {
            Schema::table($tableName, function (Blueprint $table) use ($foreignKeyName) {
                $table->dropForeign($foreignKeyName);
            });
        }

        if (Schema::hasColumn($tableName, 'voyage_id') && $this->indexExists($tableName, $indexName)) {
            Schema::table($tableName, function (Blueprint $table) use ($indexName) {
                $table->dropIndex($indexName);
            });
        }

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            if (Schema::hasColumn($tableName, 'voyage_id')) {
                $table->dropColumn('voyage_id');
            }
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            return DB::table('information_schema.statistics')
                ->whereRaw('table_schema = database()')
                ->where('table_name', $table)
                ->where('index_name', $index)
                ->exists();
        }

        if ($driver === 'pgsql') {
            return DB::table('pg_indexes')
                ->whereRaw('schemaname = current_schema()')
                ->where('tablename', $table)
                ->where('indexname', $index)
                ->exists();
        }

        if ($driver === 'sqlite') {
            $indexes = DB::select("PRAGMA index_list('{$table}')");

            foreach ($indexes as $item) {
                if (($item->name ?? null) === $index) {
                    return true;
                }
            }
        }

        return false;
    }

    private function foreignKeyExists(string $table, string $constraint): bool
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            return DB::table('information_schema.table_constraints')
                ->whereRaw('table_schema = database()')
                ->where('table_name', $table)
                ->where('constraint_name', $constraint)
                ->where('constraint_type', 'FOREIGN KEY')
                ->exists();
        }

        if ($driver === 'pgsql') {
            return DB::table('information_schema.table_constraints')
                ->whereRaw('table_schema = current_schema()')
                ->where('table_name', $table)
                ->where('constraint_name', $constraint)
                ->where('constraint_type', 'FOREIGN KEY')
                ->exists();
        }

        return false;
    }
};

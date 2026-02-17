<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const ETAPES_JOURNEE_ORDRE_INDEX = 'etapes_journee_id_ordre_idx';
    private const ETAPES_ORDRE_INDEX = 'etapes_ordre_idx';

    public function up(): void
    {
        if (Schema::hasTable('etapes')) {
            Schema::table('etapes', function (Blueprint $table) {
                if (! Schema::hasColumn('etapes', 'deleted_at')) {
                    $table->softDeletes();
                }

                if (! Schema::hasColumn('etapes', 'ordre')) {
                    $table->integer('ordre')->default(0);
                }
            });

            if (Schema::hasColumn('etapes', 'journee_id')) {
                if (! $this->indexExists('etapes', self::ETAPES_JOURNEE_ORDRE_INDEX)) {
                    Schema::table('etapes', function (Blueprint $table) {
                        $table->index(['journee_id', 'ordre'], self::ETAPES_JOURNEE_ORDRE_INDEX);
                    });
                }
            } elseif (Schema::hasColumn('etapes', 'ordre') && ! $this->indexExists('etapes', self::ETAPES_ORDRE_INDEX)) {
                Schema::table('etapes', function (Blueprint $table) {
                    $table->index('ordre', self::ETAPES_ORDRE_INDEX);
                });
            }
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('etapes')) {
            if ($this->indexExists('etapes', self::ETAPES_JOURNEE_ORDRE_INDEX)) {
                Schema::table('etapes', function (Blueprint $table) {
                    $table->dropIndex(self::ETAPES_JOURNEE_ORDRE_INDEX);
                });
            }

            if ($this->indexExists('etapes', self::ETAPES_ORDRE_INDEX)) {
                Schema::table('etapes', function (Blueprint $table) {
                    $table->dropIndex(self::ETAPES_ORDRE_INDEX);
                });
            }

            Schema::table('etapes', function (Blueprint $table) {
                if (Schema::hasColumn('etapes', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }

                if (Schema::hasColumn('etapes', 'ordre')) {
                    $table->dropColumn('ordre');
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
            });
        }
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
};

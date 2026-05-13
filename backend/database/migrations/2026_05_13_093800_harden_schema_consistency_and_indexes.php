<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const JOURNEES_VOYAGE_DAY_UNIQUE = 'journees_voyage_day_unique';
    private const JOURNEES_VOYAGE_DAY_INDEX = 'journees_voyage_day_idx';
    private const ETAPES_DAY_ORDER_UNIQUE = 'etapes_day_order_unique';
    private const ETAPES_DAY_ORDER_INDEX = 'etapes_day_order_idx';
    private const ETAPES_LIKED_STATE_INDEX = 'etapes_liked_state_idx';

    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'photo_url')) {
                    $table->text('photo_url')->nullable()->after('password');
                }
                if (! Schema::hasColumn('users', 'timezone')) {
                    $table->string('timezone', 64)->nullable()->after('photo_url');
                }
            });
        }

        if (Schema::hasTable('journees') && Schema::hasColumn('journees', 'voyage_id') && Schema::hasColumn('journees', 'numero_jour')) {
            if (! $this->indexExists('journees', self::JOURNEES_VOYAGE_DAY_UNIQUE)
                && ! $this->indexExists('journees', self::JOURNEES_VOYAGE_DAY_INDEX)
            ) {
                $hasDuplicates = DB::table('journees')
                    ->select('voyage_id', 'numero_jour')
                    ->groupBy('voyage_id', 'numero_jour')
                    ->havingRaw('COUNT(*) > 1')
                    ->exists();

                Schema::table('journees', function (Blueprint $table) use ($hasDuplicates) {
                    if ($hasDuplicates) {
                        $table->index(['voyage_id', 'numero_jour'], self::JOURNEES_VOYAGE_DAY_INDEX);
                    } else {
                        $table->unique(['voyage_id', 'numero_jour'], self::JOURNEES_VOYAGE_DAY_UNIQUE);
                    }
                });
            }
        }

        if (Schema::hasTable('etapes')) {
            if (Schema::hasColumn('etapes', 'journee_id') && Schema::hasColumn('etapes', 'ordre')) {
                if (! $this->indexExists('etapes', self::ETAPES_DAY_ORDER_UNIQUE)
                    && ! $this->indexExists('etapes', self::ETAPES_DAY_ORDER_INDEX)
                ) {
                    $hasDuplicates = DB::table('etapes')
                        ->select('journee_id', 'ordre')
                        ->groupBy('journee_id', 'ordre')
                        ->havingRaw('COUNT(*) > 1')
                        ->exists();

                    Schema::table('etapes', function (Blueprint $table) use ($hasDuplicates) {
                        if ($hasDuplicates) {
                            $table->index(['journee_id', 'ordre'], self::ETAPES_DAY_ORDER_INDEX);
                        } else {
                            $table->unique(['journee_id', 'ordre'], self::ETAPES_DAY_ORDER_UNIQUE);
                        }
                    });
                }
            }

            if (Schema::hasColumn('etapes', 'liked_state') && ! $this->indexExists('etapes', self::ETAPES_LIKED_STATE_INDEX)) {
                Schema::table('etapes', function (Blueprint $table) {
                    $table->index('liked_state', self::ETAPES_LIKED_STATE_INDEX);
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('etapes')) {
            if ($this->indexExists('etapes', self::ETAPES_LIKED_STATE_INDEX)) {
                Schema::table('etapes', function (Blueprint $table) {
                    $table->dropIndex(self::ETAPES_LIKED_STATE_INDEX);
                });
            }
            if ($this->indexExists('etapes', self::ETAPES_DAY_ORDER_UNIQUE)) {
                Schema::table('etapes', function (Blueprint $table) {
                    $table->dropUnique(self::ETAPES_DAY_ORDER_UNIQUE);
                });
            } elseif ($this->indexExists('etapes', self::ETAPES_DAY_ORDER_INDEX)) {
                Schema::table('etapes', function (Blueprint $table) {
                    $table->dropIndex(self::ETAPES_DAY_ORDER_INDEX);
                });
            }
        }

        if (Schema::hasTable('journees')) {
            if ($this->indexExists('journees', self::JOURNEES_VOYAGE_DAY_UNIQUE)) {
                Schema::table('journees', function (Blueprint $table) {
                    $table->dropUnique(self::JOURNEES_VOYAGE_DAY_UNIQUE);
                });
            } elseif ($this->indexExists('journees', self::JOURNEES_VOYAGE_DAY_INDEX)) {
                Schema::table('journees', function (Blueprint $table) {
                    $table->dropIndex(self::JOURNEES_VOYAGE_DAY_INDEX);
                });
            }
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'timezone')) {
                    $table->dropColumn('timezone');
                }
                if (Schema::hasColumn('users', 'photo_url')) {
                    $table->dropColumn('photo_url');
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

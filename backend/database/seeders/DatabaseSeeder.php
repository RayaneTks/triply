<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::withTrashed()->firstOrNew(['email' => 'test@example.com']);
        $user->forceFill([
            'name' => 'Test User',
            'password' => 'password',
            'est_admin' => false,
            'email_verified_at' => now(),
            'deleted_at' => null,
        ]);
        $user->save();

        $admin = User::withTrashed()->firstOrNew(['email' => 'admin@triply.app']);
        $admin->forceFill([
            'name' => 'Admin Triply',
            'password' => 'admin1234',
            'est_admin' => true,
            'email_verified_at' => now(),
            'deleted_at' => null,
        ]);
        $admin->save();

        // Jeu de données « investor demo » (voyage Rome géolocalisé).
        // Idempotent et indépendant des comptes ci-dessus.
        $this->call(DemoSeeder::class);
    }
}

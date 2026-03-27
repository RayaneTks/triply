<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfilePreferencesTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_persist_planning_mode_in_profile_preferences(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-device')->plainTextToken;

        $patchResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson('/api/v1/profile/preferences', [
                'planning_mode' => 'full_ai',
            ]);

        $patchResponse->assertOk();
        $patchResponse->assertJsonPath('success', true);
        $patchResponse->assertJsonPath('data.attributes.preferences.planning_mode', 'full_ai');

        $user->refresh();
        $this->assertSame('full_ai', $user->preferences->planning_mode);

        $getResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/profile');

        $getResponse->assertOk();
        $getResponse->assertJsonPath('data.attributes.preferences.planning_mode', 'full_ai');
    }

    public function test_planning_mode_validation_rejects_unknown_value(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-device')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson('/api/v1/profile/preferences', [
                'planning_mode' => 'chaos_mode',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonPath('success', false);
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $response->assertJsonStructure([
            'error' => [
                'details' => ['planning_mode'],
            ],
        ]);
    }
}

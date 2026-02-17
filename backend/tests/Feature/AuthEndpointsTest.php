<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_login_me_and_logout_flow_with_sanctum_token(): void
    {
        $registerResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Rayan',
            'email' => 'rayan@example.com',
            'password' => 'secret12345',
        ]);

        $registerResponse->assertCreated();
        $registerResponse->assertJsonStructure([
            'success',
            'data' => [
                'user' => ['id', 'name', 'email'],
                'token',
                'token_type',
            ],
            'meta',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'rayan@example.com',
            'name' => 'Rayan',
        ]);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'rayan@example.com',
            'password' => 'secret12345',
            'device_name' => 'swagger-ui',
        ]);

        $loginResponse->assertOk();
        $token = $loginResponse->json('data.token');
        $this->assertIsString($token);
        $this->assertNotEmpty($token);

        $meResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me');

        $meResponse->assertOk();
        $meResponse->assertJsonPath('data.user.email', 'rayan@example.com');

        $logoutResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout');

        $logoutResponse->assertOk();
        $logoutResponse->assertJsonPath('data.revoked', true);

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'rayan@example.com',
            'password' => 'secret12345',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'rayan@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $response->assertJsonStructure([
            'error' => [
                'details' => ['email'],
            ],
        ]);
    }

    public function test_register_fails_when_email_already_exists(): void
    {
        User::factory()->create([
            'email' => 'used@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Rayan',
            'email' => 'used@example.com',
            'password' => 'secret12345',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonPath('success', false);
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $response->assertJsonPath('error.message', 'Requete invalide');
        $response->assertJsonStructure([
            'error' => [
                'details' => ['email'],
            ],
        ]);
    }

    public function test_register_returns_custom_validation_payload_when_body_is_invalid(): void
    {
        $response = $this->postJson('/api/v1/auth/register', []);

        $response->assertUnprocessable();
        $response->assertJsonPath('success', false);
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $response->assertJsonPath('error.message', 'Requete invalide');
        $response->assertJsonPath('error.details.name.0', 'Ce champ est obligatoire.');
        $response->assertJsonPath('error.details.email.0', 'Ce champ est obligatoire.');
        $response->assertJsonPath('error.details.password.0', 'Ce champ est obligatoire.');
    }

    public function test_me_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertUnauthorized();
        $response->assertJsonPath('success', false);
        $response->assertJsonPath('error.code', 'UNAUTHORIZED');
    }

    public function test_logout_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertUnauthorized();
        $response->assertJsonPath('success', false);
        $response->assertJsonPath('error.code', 'UNAUTHORIZED');
    }

    public function test_forgot_password_returns_accepted_for_existing_user(): void
    {
        User::factory()->create([
            'email' => 'resetme@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'resetme@example.com',
        ]);

        $response->assertStatus(202);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.requested', true);
        $response->assertJsonPath('data.email', 'resetme@example.com');
    }

    public function test_forgot_password_returns_custom_validation_payload_when_email_missing(): void
    {
        $response = $this->postJson('/api/v1/auth/forgot-password', []);

        $response->assertUnprocessable();
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $response->assertJsonPath('error.details.email.0', 'Ce champ est obligatoire.');
    }

    public function test_reset_password_updates_user_password_with_valid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'reset@example.com',
            'password' => 'oldSecret123',
        ]);

        $token = Password::createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'reset@example.com',
            'password' => 'newSecret123',
            'password_confirmation' => 'newSecret123',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.reset', true);

        $user->refresh();
        $this->assertTrue(Hash::check('newSecret123', $user->password));
    }

    public function test_reset_password_fails_with_invalid_token(): void
    {
        User::factory()->create([
            'email' => 'reset-invalid@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'invalid-token',
            'email' => 'reset-invalid@example.com',
            'password' => 'newSecret123',
            'password_confirmation' => 'newSecret123',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $response->assertJsonStructure([
            'error' => [
                'details' => ['token'],
            ],
        ]);
    }

    public function test_verify_email_marks_user_as_verified_with_valid_hash(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'verifyme@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/email/verify', [
            'id' => (string) $user->id,
            'hash' => sha1($user->email),
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.verified', true);

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_verify_email_fails_with_invalid_hash(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->postJson('/api/v1/auth/email/verify', [
            'id' => (string) $user->id,
            'hash' => 'invalid-hash',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $response->assertJsonStructure([
            'error' => [
                'details' => ['hash'],
            ],
        ]);
    }
}

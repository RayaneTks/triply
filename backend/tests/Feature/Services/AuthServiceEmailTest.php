<?php

namespace Tests\Feature\Services;

use App\Models\User;
use App\Services\Contracts\AuthServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AuthServiceEmailTest extends TestCase
{
    use RefreshDatabase;

    private AuthServiceInterface $service;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();
        $this->service = $this->app->make(AuthServiceInterface::class);
    }

    private function verificationPayload(User $user, ?int $expires = null): array
    {
        $ts = $expires ?? now()->addHour()->timestamp;
        $base = [
            'id' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
            'expires' => $ts,
        ];
        $base['signature'] = hash_hmac('sha256', http_build_query($base), (string) config('app.key'));

        return $base;
    }

    public function test_verify_email_marks_user_as_verified(): void
    {
        $user = User::factory()->unverified()->create();

        $result = $this->service->verifyEmail($this->verificationPayload($user));

        $this->assertTrue($result['verified']);
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_verify_email_rejects_invalid_hash(): void
    {
        $user = User::factory()->unverified()->create();
        $payload = $this->verificationPayload($user);
        $payload['hash'] = 'invalid_hash';

        $this->expectException(ValidationException::class);
        $this->service->verifyEmail($payload);
    }

    public function test_verify_email_rejects_unknown_user(): void
    {
        $this->expectException(ValidationException::class);
        $this->service->verifyEmail([
            'id' => 99999,
            'hash' => 'any',
            'expires' => now()->addHour()->timestamp,
            'signature' => 'any',
        ]);
    }

    public function test_forgot_password_emits_event_for_existing_user(): void
    {
        $user = User::factory()->create();

        $result = $this->service->forgotPassword(['email' => $user->email]);

        $this->assertTrue($result['requested']);
        Event::assertDispatched(\App\Events\PasswordResetRequested::class);
    }

    public function test_forgot_password_emits_event_even_for_unknown_email(): void
    {
        $result = $this->service->forgotPassword(['email' => 'noone@example.com']);

        $this->assertTrue($result['requested']);
        Event::assertDispatched(\App\Events\PasswordResetRequested::class);
    }

    public function test_verify_email_is_idempotent_when_already_verified(): void
    {
        $user = User::factory()->create();
        $alreadyVerifiedAt = $user->email_verified_at;

        $result = $this->service->verifyEmail($this->verificationPayload($user));

        $this->assertTrue($result['verified']);
        $this->assertEquals(
            $alreadyVerifiedAt->toIso8601String(),
            $user->fresh()->email_verified_at->toIso8601String()
        );
    }

    public function test_verify_email_rejects_expired_link(): void
    {
        $user = User::factory()->unverified()->create();
        $payload = $this->verificationPayload($user, now()->subMinute()->timestamp);

        $this->expectException(ValidationException::class);
        $this->service->verifyEmail($payload);
    }

    public function test_verify_email_rejects_invalid_signature(): void
    {
        $user = User::factory()->unverified()->create();
        $payload = $this->verificationPayload($user);
        $payload['signature'] = 'bad_signature';

        $this->expectException(ValidationException::class);
        $this->service->verifyEmail($payload);
    }
}

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

    public function test_verify_email_marks_user_as_verified(): void
    {
        $user = User::factory()->unverified()->create();
        $hash = sha1($user->getEmailForVerification());

        $result = $this->service->verifyEmail(['id' => $user->id, 'hash' => $hash]);

        $this->assertTrue($result['verified']);
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_verify_email_rejects_invalid_hash(): void
    {
        $user = User::factory()->unverified()->create();

        $this->expectException(ValidationException::class);
        $this->service->verifyEmail(['id' => $user->id, 'hash' => 'invalid_hash']);
    }

    public function test_verify_email_rejects_unknown_user(): void
    {
        $this->expectException(ValidationException::class);
        $this->service->verifyEmail(['id' => 99999, 'hash' => 'any']);
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
        $hash = sha1($user->getEmailForVerification());

        $result = $this->service->verifyEmail(['id' => $user->id, 'hash' => $hash]);

        $this->assertTrue($result['verified']);
        $this->assertEquals(
            $alreadyVerifiedAt->toIso8601String(),
            $user->fresh()->email_verified_at->toIso8601String()
        );
    }
}

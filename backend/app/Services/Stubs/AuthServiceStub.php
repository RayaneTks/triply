<?php

namespace App\Services\Stubs;

use App\Services\Contracts\AuthServiceInterface;

class AuthServiceStub implements AuthServiceInterface
{
    public function register(array $payload): array
    {
        return ['id' => 'usr_stub_001', 'type' => 'user', 'attributes' => ['email' => $payload['email'], 'name' => $payload['name']], 'todo' => 'Persist user and send verification email'];
    }

    public function login(array $payload): array
    {
        return ['id' => 'session_stub_001', 'type' => 'auth_session', 'attributes' => ['token' => 'stub-token', 'email' => $payload['email']], 'todo' => 'Validate credentials and issue Sanctum token'];
    }

    public function logout(): array
    {
        return ['id' => 'session_stub_001', 'type' => 'auth_session', 'attributes' => ['revoked' => true], 'todo' => 'Revoke active tokens'];
    }

    public function me(): array
    {
        return ['id' => 'usr_stub_001', 'type' => 'user', 'attributes' => ['name' => 'Stub User', 'email' => 'stub@triply.local'], 'todo' => 'Resolve authenticated user'];
    }

    public function forgotPassword(array $payload): array
    {
        return ['id' => 'pwd_reset_request_stub', 'type' => 'password_reset', 'attributes' => ['email' => $payload['email']], 'todo' => 'Generate reset token and send email'];
    }

    public function resetPassword(array $payload): array
    {
        return ['id' => 'pwd_reset_stub', 'type' => 'password_reset', 'attributes' => ['email' => $payload['email'], 'reset' => true], 'todo' => 'Validate token and update hashed password'];
    }

    public function verifyEmail(array $payload): array
    {
        return ['id' => $payload['id'], 'type' => 'email_verification', 'attributes' => ['verified' => true], 'todo' => 'Validate signed URL then mark email as verified'];
    }
}

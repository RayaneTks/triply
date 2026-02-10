<?php

namespace App\Services\Contracts;

interface AuthServiceInterface
{
    public function register(array $payload): array;
    public function login(array $payload): array;
    public function logout(): array;
    public function me(): array;
    public function forgotPassword(array $payload): array;
    public function resetPassword(array $payload): array;
    public function verifyEmail(array $payload): array;
}

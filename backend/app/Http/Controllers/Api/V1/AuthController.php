<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Auth\ForgotPasswordRequest;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Requests\Api\V1\Auth\ResetPasswordRequest;
use App\Http\Requests\Api\V1\Auth\VerifyEmailRequest;
use App\Services\Contracts\AuthServiceInterface;

class AuthController extends ApiController
{
    public function __construct(private readonly AuthServiceInterface $authService)
    {
    }

    public function register(RegisterRequest $request)
    {
        return $this->successResponse($this->authService->register($request->validated()), status: 201);
    }

    public function login(LoginRequest $request)
    {
        return $this->successResponse($this->authService->login($request->validated()));
    }

    public function logout()
    {
        return $this->successResponse($this->authService->logout());
    }

    public function me()
    {
        return $this->successResponse($this->authService->me());
    }

    public function forgotPassword(ForgotPasswordRequest $request)
    {
        return $this->successResponse($this->authService->forgotPassword($request->validated()), status: 202);
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        return $this->successResponse($this->authService->resetPassword($request->validated()));
    }

    public function verifyEmail(VerifyEmailRequest $request)
    {
        return $this->successResponse($this->authService->verifyEmail($request->validated()));
    }
}

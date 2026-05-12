<?php

namespace App\Services;

use App\Events\EmailVerificationRequested;
use App\Events\PasswordResetRequested;
use App\Models\User;
use App\Services\Contracts\AuthServiceInterface;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService implements AuthServiceInterface
{
    public function register(array $payload): array
    {
        $user = User::query()->create([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => $payload['password'],
        ]);

        $token = $user->createToken('swagger')->plainTextToken;

        event(new EmailVerificationRequested(
            userId: (string) $user->id,
            email: $user->email,
            name: $user->name,
            verificationUrl: $this->buildVerificationUrl($user),
        ));

        return [
            'user' => $this->serializeUser($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    public function login(array $payload): array
    {
        $user = User::query()->where('email', $payload['email'])->first();

        if (! $user || ! Hash::check($payload['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont invalides.'],
            ]);
        }

        $token = $user->createToken($payload['device_name'] ?? 'swagger')->plainTextToken;

        return [
            'user' => $this->serializeUser($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    public function logout(): array
    {
        $user = Auth::user();
        $currentToken = $user?->currentAccessToken();

        if ($currentToken) {
            $currentToken->delete();
        } elseif ($user) {
            $user->tokens()->delete();
        }

        return [
            'revoked' => true,
        ];
    }

    public function me(): array
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            throw ValidationException::withMessages([
                'auth' => ['Utilisateur non authentifie.'],
            ]);
        }

        return [
            'user' => $this->serializeUser($user),
        ];
    }

    public function forgotPassword(array $payload): array
    {
        $user = User::query()->where('email', $payload['email'])->first();
        $resetUrl = null;
        $name = null;

        if ($user) {
            $token = Password::broker()->createToken($user);
            $resetUrl = $this->buildPasswordResetUrl($token, $user->email);
            $name = $user->name;
        }

        event(new PasswordResetRequested(
            email: $payload['email'],
            name: $name,
            resetUrl: $resetUrl,
        ));

        return [
            'requested' => true,
            'email' => $payload['email'],
        ];
    }

    public function resetPassword(array $payload): array
    {
        $status = Password::reset(
            [
                'email' => $payload['email'],
                'password' => $payload['password'],
                'password_confirmation' => $payload['password_confirmation'] ?? null,
                'token' => $payload['token'],
            ],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'token' => [__($status)],
            ]);
        }

        return [
            'reset' => true,
            'email' => $payload['email'],
        ];
    }

    public function verifyEmail(array $payload): array
    {
        $user = User::query()->find($payload['id']);

        if (! $user) {
            throw ValidationException::withMessages([
                'id' => ['Utilisateur introuvable.'],
            ]);
        }

        if (! hash_equals(sha1($user->getEmailForVerification()), (string) $payload['hash'])) {
            throw ValidationException::withMessages([
                'hash' => ['Hash de verification invalide.'],
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return [
            'verified' => true,
            'user' => $this->serializeUser($user->fresh()),
        ];
    }

    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'est_admin' => (bool) $user->est_admin,
            'email_verified_at' => $user->email_verified_at?->toISOString(),
            'created_at' => $user->created_at?->toISOString(),
            'updated_at' => $user->updated_at?->toISOString(),
        ];
    }

    private function buildVerificationUrl(User $user): string
    {
        $frontendBase = rtrim((string) config('app.frontend_url', env('APP_FRONTEND_URL', 'http://localhost:5173')), '/');
        $params = [
            'id' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
            'expires' => Carbon::now()->addMinutes(60)->getTimestamp(),
        ];
        // Signature simple (HMAC sur APP_KEY) pour permettre la revérification ultérieure.
        $params['signature'] = hash_hmac('sha256', http_build_query($params), (string) config('app.key'));

        return $frontendBase.'/auth/verify-email?'.http_build_query($params);
    }

    private function buildPasswordResetUrl(string $token, string $email): string
    {
        $frontendBase = rtrim((string) config('app.frontend_url', env('APP_FRONTEND_URL', 'http://localhost:5173')), '/');
        $params = [
            'token' => $token,
            'email' => $email,
        ];

        return $frontendBase.'/reinitialisation?'.http_build_query($params);
    }
}

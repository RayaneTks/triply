<?php

namespace App\Services;

use App\Models\Consent;
use App\Services\Contracts\ConsentServiceInterface;
use Illuminate\Support\Facades\Auth;

/**
 * Persiste le consentement cookies. Clé par utilisateur authentifié (token
 * Sanctum) lorsqu'il est présent, sinon par identifiant de session anonyme.
 *
 * La route /consent est publique : on lit le porteur via le guard sanctum
 * directement plutôt que via le guard par défaut (web).
 */
class ConsentService implements ConsentServiceInterface
{
    private const DEFAULTS = [
        'analytics' => false,
        'marketing' => false,
        'functional' => true,
        'version' => '1.0',
    ];

    public function getConsent(): array
    {
        $consent = $this->resolveExisting();

        if (! $consent) {
            return $this->present(null, self::DEFAULTS);
        }

        return $this->present($consent, [
            'analytics' => $consent->analytics,
            'marketing' => $consent->marketing,
            'functional' => $consent->functional,
            'version' => $consent->version,
        ]);
    }

    public function saveConsent(array $payload): array
    {
        $user = $this->currentUser();
        $sessionId = $user ? null : $this->sessionId();

        $attributes = [
            'analytics' => (bool) ($payload['analytics'] ?? false),
            'marketing' => (bool) ($payload['marketing'] ?? false),
            'functional' => (bool) ($payload['functional'] ?? true),
            'version' => (string) ($payload['version'] ?? self::DEFAULTS['version']),
        ];

        $consent = Consent::query()->updateOrCreate(
            $user
                ? ['user_id' => $user->id]
                : ['session_id' => $sessionId],
            $attributes + [
                'user_id' => $user?->id,
                'session_id' => $sessionId,
            ]
        );

        return $this->present($consent, $attributes);
    }

    private function resolveExisting(): ?Consent
    {
        $user = $this->currentUser();
        if ($user) {
            return Consent::query()->where('user_id', $user->id)->first();
        }

        $sessionId = $this->sessionId();
        if ($sessionId === null) {
            return null;
        }

        return Consent::query()->where('session_id', $sessionId)->first();
    }

    private function currentUser()
    {
        return Auth::user() ?? Auth::guard('sanctum')->user();
    }

    private function sessionId(): ?string
    {
        try {
            $id = session()->getId();
        } catch (\Throwable) {
            return null;
        }

        return $id !== '' ? $id : null;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function present(?Consent $consent, array $attributes): array
    {
        return [
            'id' => $consent ? (string) $consent->id : 'consent_default',
            'type' => 'consent',
            'attributes' => [
                'analytics' => (bool) $attributes['analytics'],
                'marketing' => (bool) $attributes['marketing'],
                'functional' => (bool) $attributes['functional'],
                'version' => (string) $attributes['version'],
                'updated_at' => $consent?->updated_at?->toISOString(),
            ],
        ];
    }
}

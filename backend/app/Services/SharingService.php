<?php

namespace App\Services;

use App\Models\ShareLink;
use App\Models\Voyage;
use App\Services\Contracts\SharingServiceInterface;
use App\Services\Contracts\TripServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SharingService implements SharingServiceInterface
{
    public function __construct(private readonly TripServiceInterface $tripService)
    {
    }

    public function createShareLink(string $tripId, array $payload): array
    {
        $user = Auth::user();
        if (! $user) {
            throw new ModelNotFoundException('Utilisateur non authentifie.');
        }

        $voyage = Voyage::query()
            ->where('id', $tripId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $ttlDays = isset($payload['ttl_days']) && is_numeric($payload['ttl_days'])
            ? (int) $payload['ttl_days']
            : 30;
        $ttlDays = max(1, min($ttlDays, 365));

        $token = Str::random(40);
        while (ShareLink::query()->where('token', $token)->exists()) {
            $token = Str::random(40);
        }

        $data = [
            'voyage_id' => $voyage->id,
            'token' => $token,
            'expires_at' => Carbon::now()->addDays($ttlDays),
        ];

        if (! empty($payload['password']) && is_string($payload['password'])) {
            $data['password_hash'] = Hash::make($payload['password']);
        }

        $link = ShareLink::query()->create($data);

        $frontendBase = rtrim((string) config('app.frontend_url'), '/');

        return [
            'id' => (string) $link->id,
            'token' => $link->token,
            'expires_at' => $link->expires_at?->toIso8601String(),
            'share_url' => $frontendBase !== '' ? $frontendBase.'/share/'.$link->token : '/share/'.$link->token,
        ];
    }

    public function publicRecap(string $token, ?string $providedPassword = null): array
    {
        $link = ShareLink::query()->where('token', $token)->first();
        if ($link === null || $link->isExpired()) {
            throw new ModelNotFoundException('Lien de partage invalide ou expire.');
        }

        if ($link->password_hash !== null) {
            if ($providedPassword === null || $providedPassword === '') {
                return [
                    'error_code' => 'SHARE_PASSWORD_REQUIRED',
                    'error_message' => 'Mot de passe requis pour acceder a ce lien.',
                    '_httpStatus' => 401,
                ];
            }

            if (! Hash::check($providedPassword, $link->password_hash)) {
                return [
                    'error_code' => 'SHARE_PASSWORD_INVALID',
                    'error_message' => 'Mot de passe invalide.',
                    '_httpStatus' => 401,
                ];
            }
        }

        $voyage = Voyage::query()->find($link->voyage_id);
        if ($voyage === null) {
            throw new ModelNotFoundException('Voyage introuvable.');
        }

        // On joue l'authentification cote serveur en se substituant a l'auteur du voyage
        // pour reutiliser le service recap (qui filtre par utilisateur courant).
        $owner = $voyage->user;
        if ($owner === null) {
            throw new ModelNotFoundException('Auteur du voyage introuvable.');
        }
        Auth::setUser($owner);

        $recap = $this->tripService->recap((string) $voyage->id);

        return $this->scrubSensitiveData($recap);
    }

    /**
     * Retire les champs sensibles (emails, urls de booking privees, etc.) de la reponse publique.
     *
     * @param  array<string, mixed>  $recap
     * @return array<string, mixed>
     */
    private function scrubSensitiveData(array $recap): array
    {
        if (isset($recap['trip']) && is_array($recap['trip'])) {
            $trip = $recap['trip'];
            unset($trip['user'], $trip['user_id']);
            if (isset($trip['plan_snapshot']) && is_array($trip['plan_snapshot'])) {
                $snapshot = $trip['plan_snapshot'];
                foreach (['flightSummary', 'hotelSummary'] as $section) {
                    if (isset($snapshot[$section]) && is_array($snapshot[$section])) {
                        unset($snapshot[$section]['bookingUrl']);
                    }
                }
                $trip['plan_snapshot'] = $snapshot;
            }
            $recap['trip'] = $trip;
        }

        return $recap;
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Abonnement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUsersController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 50);
        $limit = max(1, min(200, $limit));
        $search = trim((string) $request->query('search', ''));

        $query = User::query()
            ->withTrashed()
            ->with(['abonnements' => fn ($q) => $q->latest('date_fin')->limit(1)])
            ->select(['id', 'name', 'email', 'est_admin', 'subscription_tier', 'created_at', 'deleted_at'])
            ->orderByDesc('created_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('email', 'like', '%'.$search.'%')
                    ->orWhere('name', 'like', '%'.$search.'%');
            });
        }

        $items = $query->limit($limit)->get()->map(fn (User $user) => [
            'latest_subscription' => $this->serializeLatestSubscription($user),
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'est_admin' => (bool) $user->est_admin,
            'subscription_tier' => $user->subscription_tier,
            'created_at' => $user->created_at?->toISOString(),
            'suspended' => $user->deleted_at !== null,
        ])->values()->all();

        return $this->successResponse([
            'items' => $items,
            'count' => count($items),
        ]);
    }

    public function update(string $userId, Request $request): JsonResponse
    {
        $payload = $request->validate([
            'est_admin' => ['sometimes', 'boolean'],
            'subscription_tier' => ['sometimes', 'nullable', 'string', 'max:32'],
            'subscription_status' => ['sometimes', 'nullable', 'string', 'in:active,canceled,expired,incomplete'],
            'subscription_billing' => ['sometimes', 'nullable', 'string', 'in:monthly,annual'],
            'subscription_ends_at' => ['sometimes', 'nullable', 'date'],
            'suspended' => ['sometimes', 'boolean'],
        ]);

        $target = User::query()->withTrashed()->findOrFail($userId);
        $current = $request->user();

        if ($current && (string) $current->id === (string) $target->id && array_key_exists('est_admin', $payload) && $payload['est_admin'] === false) {
            return $this->errorResponse('ADMIN_SELF_DOWNGRADE_BLOCKED', 'Vous ne pouvez pas retirer votre propre rôle administrateur.', status: 422);
        }

        $target->fill([
            'est_admin' => $payload['est_admin'] ?? $target->est_admin,
            'subscription_tier' => array_key_exists('subscription_tier', $payload) ? $payload['subscription_tier'] : $target->subscription_tier,
        ]);
        $target->save();

        if (
            array_key_exists('subscription_tier', $payload)
            || array_key_exists('subscription_status', $payload)
            || array_key_exists('subscription_billing', $payload)
            || array_key_exists('subscription_ends_at', $payload)
        ) {
            $this->syncSubscriptionFromAdminPayload($target, $payload);
            $target->refresh();
        }

        if (array_key_exists('suspended', $payload)) {
            if ($payload['suspended'] === true && $target->deleted_at === null) {
                $target->delete();
            }
            if ($payload['suspended'] === false && $target->deleted_at !== null) {
                $target->restore();
            }
            $target->refresh();
        }

        return $this->successResponse([
            'latest_subscription' => $this->serializeLatestSubscription($target->load(['abonnements' => fn ($q) => $q->latest('date_fin')->limit(1)])),
            'id' => (string) $target->id,
            'name' => $target->name,
            'email' => $target->email,
            'est_admin' => (bool) $target->est_admin,
            'subscription_tier' => $target->subscription_tier,
            'created_at' => $target->created_at?->toISOString(),
            'suspended' => $target->deleted_at !== null,
        ]);
    }

    private function syncSubscriptionFromAdminPayload(User $target, array $payload): void
    {
        $tier = array_key_exists('subscription_tier', $payload)
            ? ($payload['subscription_tier'] ?: null)
            : $target->subscription_tier;

        if ($tier === null) {
            Abonnement::query()
                ->where('utilisateur_id', $target->id)
                ->where('statut', 'active')
                ->update(['statut' => 'canceled', 'date_fin' => now()]);

            $target->forceFill(['subscription_tier' => null])->save();

            return;
        }

        $status = $payload['subscription_status'] ?? 'active';
        $billing = $payload['subscription_billing'] ?? 'monthly';
        $endsAt = array_key_exists('subscription_ends_at', $payload)
            ? ($payload['subscription_ends_at'] ? Carbon::parse($payload['subscription_ends_at']) : null)
            : null;
        $computedEnd = $endsAt ?? ($billing === 'annual' ? now()->addYear() : now()->addMonth());

        /** @var Abonnement|null $abonnement */
        $abonnement = Abonnement::query()
            ->where('utilisateur_id', $target->id)
            ->latest('date_fin')
            ->first();

        if (! $abonnement) {
            $abonnement = new Abonnement();
            $abonnement->utilisateur_id = $target->id;
            $abonnement->abonnement_stripe_id = 'admin_manual_'.$target->id.'_'.now()->timestamp;
            $abonnement->date_debut = now();
        }

        $abonnement->tier = $tier;
        $abonnement->plan_interval = $billing;
        $abonnement->statut = $status;
        $abonnement->date_fin = $computedEnd;
        if (! $abonnement->date_debut) {
            $abonnement->date_debut = now();
        }
        $abonnement->save();

        $target->forceFill(['subscription_tier' => $tier])->save();
    }

    private function serializeLatestSubscription(User $user): ?array
    {
        /** @var Abonnement|null $sub */
        $sub = $user->abonnements->first();
        if (! $sub) {
            return null;
        }

        return [
            'id' => (string) $sub->id,
            'tier' => $sub->tier,
            'status' => $sub->statut,
            'billing' => $sub->plan_interval,
            'starts_at' => $sub->date_debut?->toISOString(),
            'ends_at' => $sub->date_fin?->toISOString(),
        ];
    }
}


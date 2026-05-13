<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\User;
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
            ->select(['id', 'name', 'email', 'est_admin', 'subscription_tier', 'created_at', 'deleted_at'])
            ->orderByDesc('created_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('email', 'like', '%'.$search.'%')
                    ->orWhere('name', 'like', '%'.$search.'%');
            });
        }

        $items = $query->limit($limit)->get()->map(fn (User $user) => [
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
            'suspended' => ['sometimes', 'boolean'],
        ]);

        $target = User::query()->withTrashed()->findOrFail($userId);
        $current = $request->user();

        if ($current && (string) $current->id === (string) $target->id && array_key_exists('est_admin', $payload) && $payload['est_admin'] === false) {
            return $this->errorResponse('ADMIN_SELF_DOWNGRADE_BLOCKED', 'Vous ne pouvez pas retirer votre propre rôle administrateur.', status: 422);
        }

        $target->fill($payload);
        $target->save();
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
            'id' => (string) $target->id,
            'name' => $target->name,
            'email' => $target->email,
            'est_admin' => (bool) $target->est_admin,
            'subscription_tier' => $target->subscription_tier,
            'created_at' => $target->created_at?->toISOString(),
            'suspended' => $target->deleted_at !== null,
        ]);
    }
}


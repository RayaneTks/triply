<?php

namespace App\Policies;

use App\Models\Etape;
use App\Models\User;

class ActivityPolicy
{
    public function view(User $user, Etape $etape): bool
    {
        return $user->id === $etape->journee->voyage->user_id;
    }

    public function update(User $user, Etape $etape): bool
    {
        return $user->id === $etape->journee->voyage->user_id;
    }

    public function delete(User $user, Etape $etape): bool
    {
        return $user->id === $etape->journee->voyage->user_id;
    }
}

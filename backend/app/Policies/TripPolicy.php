<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Voyage;

class TripPolicy
{
    public function view(User $user, Voyage $voyage): bool
    {
        return $user->id === $voyage->user_id;
    }

    public function update(User $user, Voyage $voyage): bool
    {
        return $user->id === $voyage->user_id;
    }

    public function delete(User $user, Voyage $voyage): bool
    {
        return $user->id === $voyage->user_id;
    }
}

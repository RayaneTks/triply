<?php

namespace App\Policies;

use App\Models\User;

class TripPolicy
{
    public function view(User $user, mixed $trip): bool
    {
        // TODO: Implement ownership or membership checks.
        return true;
    }

    public function update(User $user, mixed $trip): bool
    {
        // TODO: Implement write permissions.
        return true;
    }

    public function delete(User $user, mixed $trip): bool
    {
        // TODO: Implement delete permissions.
        return true;
    }
}

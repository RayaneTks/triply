<?php

namespace App\Policies;

use App\Models\User;

class ActivityPolicy
{
    public function view(User $user, mixed $activity): bool
    {
        // TODO: Implement activity visibility checks.
        return true;
    }

    public function update(User $user, mixed $activity): bool
    {
        // TODO: Implement activity update permissions.
        return true;
    }

    public function delete(User $user, mixed $activity): bool
    {
        // TODO: Implement activity delete permissions.
        return true;
    }
}

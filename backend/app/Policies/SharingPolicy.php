<?php

namespace App\Policies;

use App\Models\ShareLink;
use App\Models\User;

class SharingPolicy
{
    public function view(User $user, ShareLink $shareLink): bool
    {
        return $user->id === $shareLink->voyage->user_id;
    }

    public function delete(User $user, ShareLink $shareLink): bool
    {
        return $user->id === $shareLink->voyage->user_id;
    }
}

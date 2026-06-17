<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class TravelPolicy
{
    public function view(User $user, Model $resource): bool
    {
        return $this->ownsParent($user, $resource);
    }

    public function update(User $user, Model $resource): bool
    {
        return $this->ownsParent($user, $resource);
    }

    public function delete(User $user, Model $resource): bool
    {
        return $this->ownsParent($user, $resource);
    }

    private function ownsParent(User $user, Model $resource): bool
    {
        if (! method_exists($resource, 'voyage')) {
            return false;
        }

        return $user->id === $resource->voyage->user_id;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voyage extends Model
{
    public function hebergements(): HasMany
    {
        return $this->hasMany(Hebergement::class);
    }

    public function transports(): HasMany
    {
        return $this->hasMany(Transport::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Hebergement extends Model
{
    public function voyage(): BelongsTo
    {
        return $this->belongsTo(Voyage::class);
    }
}

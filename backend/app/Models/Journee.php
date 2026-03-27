<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Journee extends Model
{
    protected $fillable = [
        'date_jour',
        'numero_jour',
        'voyage_id',
    ];

    protected $casts = [
        'date_jour' => 'date',
    ];

    public function voyage(): BelongsTo
    {
        return $this->belongsTo(Voyage::class);
    }

    public function etapes(): HasMany
    {
        return $this->hasMany(Etape::class);
    }
}

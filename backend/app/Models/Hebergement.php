<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Hebergement extends Model
{
    protected $fillable = [
        'type',
        'nom',
        'adresse',
        'code_postal',
        'ville',
        'latitude',
        'longitude',
        'arrivee_le',
        'depart_le',
        'prix',
        'devise',
        'informations_supplementaire',
        'voyage_id',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'arrivee_le' => 'datetime',
        'depart_le' => 'datetime',
    ];

    public function voyage(): BelongsTo
    {
        return $this->belongsTo(Voyage::class);
    }
}

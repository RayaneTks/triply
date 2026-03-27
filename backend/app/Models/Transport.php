<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transport extends Model
{
    protected $fillable = [
        'type',
        'depart_lieu',
        'arrivee_lieu',
        'depart_le',
        'arrivee_le',
        'prix',
        'devise',
        'information_supplementaire',
        'voyage_id',
    ];

    protected $casts = [
        'depart_le' => 'datetime',
        'arrivee_le' => 'datetime',
    ];

    public function voyage(): BelongsTo
    {
        return $this->belongsTo(Voyage::class);
    }
}

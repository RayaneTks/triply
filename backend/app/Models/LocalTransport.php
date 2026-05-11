<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LocalTransport extends Model
{
    protected $fillable = [
        'voyage_id',
        'type',
        'from_label',
        'to_label',
        'departure_at',
        'arrival_at',
        'price',
        'currency',
        'notes',
    ];

    protected $casts = [
        'departure_at' => 'datetime',
        'arrival_at' => 'datetime',
        'price' => 'decimal:2',
    ];

    public function voyage(): BelongsTo
    {
        return $this->belongsTo(Voyage::class);
    }
}

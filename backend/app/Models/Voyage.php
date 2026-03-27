<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voyage extends Model
{
    protected $fillable = [
        'titre',
        'destination',
        'date_debut',
        'date_fin',
        'budget_total',
        'nb_voyageurs',
        'description',
        'user_id',
        'plan_snapshot',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'plan_snapshot' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function journees(): HasMany
    {
        return $this->hasMany(Journee::class)->orderBy('numero_jour');
    }

    public function hebergements(): HasMany
    {
        return $this->hasMany(Hebergement::class);
    }

    public function transports(): HasMany
    {
        return $this->hasMany(Transport::class);
    }
}

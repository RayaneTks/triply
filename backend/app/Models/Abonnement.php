<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Abonnement extends Model
{
    protected $fillable = [
        'utilisateur_id',
        'abonnement_stripe_id',
        'tier',
        'plan_interval',
        'statut',
        'date_debut',
        'date_fin',
    ];

    protected $casts = [
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }
}

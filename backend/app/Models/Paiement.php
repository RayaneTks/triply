<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Paiement extends Model
{
    protected $fillable = [
        'facture_stripe_id',
        'intention_paiement_stripe_id',
        'montant',
        'statut',
        'devise',
        'paye_le',
        'periode_debut',
        'periode_fin',
        'abonnement_id',
    ];

    protected $casts = [
        'montant' => 'integer',
        'paye_le' => 'datetime',
        'periode_debut' => 'datetime',
        'periode_fin' => 'datetime',
    ];

    public function abonnement(): BelongsTo
    {
        return $this->belongsTo(Abonnement::class);
    }
}

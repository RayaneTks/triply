<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Etape extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'temps_estime',
        'titre',
        'description',
        'prix_estime',
        'ville',
        'pays',
        'source_lien',
        'journee_id',
        'ordre',
        'liked_state',
    ];

    public function journee(): BelongsTo
    {
        return $this->belongsTo(Journee::class);
    }
}

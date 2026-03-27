<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Etape extends Model
{
    use SoftDeletes;

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
    ];

    public function journee(): BelongsTo
    {
        return $this->belongsTo(Journee::class);
    }
}

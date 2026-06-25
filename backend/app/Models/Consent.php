<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Consent extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'analytics',
        'marketing',
        'functional',
        'version',
    ];

    protected $casts = [
        'analytics' => 'boolean',
        'marketing' => 'boolean',
        'functional' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

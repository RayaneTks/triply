<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EmailVerificationRequested
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public readonly string $userId, public readonly string $email)
    {
    }
}

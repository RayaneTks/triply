<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PasswordResetRequested
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly string $email,
        public readonly ?string $name = null,
        public readonly ?string $resetUrl = null,
    ) {
    }
}

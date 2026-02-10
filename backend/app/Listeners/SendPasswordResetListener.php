<?php

namespace App\Listeners;

use App\Events\PasswordResetRequested;

class SendPasswordResetListener
{
    public function handle(PasswordResetRequested $event): void
    {
        // TODO: Queue and send password reset email.
    }
}

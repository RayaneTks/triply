<?php

namespace App\Listeners;

use App\Events\EmailVerificationRequested;

class SendEmailVerificationListener
{
    public function handle(EmailVerificationRequested $event): void
    {
        // TODO: Queue and send verification email.
    }
}

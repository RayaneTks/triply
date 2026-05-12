<?php

namespace App\Listeners;

use App\Events\EmailVerificationRequested;
use App\Mail\EmailVerificationMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendEmailVerificationListener
{
    public function handle(EmailVerificationRequested $event): void
    {
        try {
            Mail::to($event->email)->send(new EmailVerificationMail(
                name: $event->name,
                verificationUrl: $event->verificationUrl,
            ));
        } catch (Throwable $e) {
            Log::warning('Failed to dispatch email verification mail.', [
                'email' => $event->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

<?php

namespace App\Listeners;

use App\Events\PasswordResetRequested;
use App\Mail\PasswordResetMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendPasswordResetListener
{
    public function handle(PasswordResetRequested $event): void
    {
        if ($event->resetUrl === null) {
            // Sécurité : si aucune URL n'a pu être générée (pas d'utilisateur), on n'envoie rien
            // pour éviter de divulguer si l'email existe ou non.
            return;
        }

        try {
            Mail::to($event->email)->send(new PasswordResetMail(
                name: $event->name ?? 'Voyageur',
                resetUrl: $event->resetUrl,
            ));
        } catch (Throwable $e) {
            Log::warning('Failed to dispatch password reset mail.', [
                'email' => $event->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

<?php

namespace App\Providers;

use App\Events\EmailVerificationRequested;
use App\Events\PasswordResetRequested;
use App\Listeners\SendEmailVerificationListener;
use App\Listeners\SendPasswordResetListener;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        EmailVerificationRequested::class => [
            SendEmailVerificationListener::class,
        ],
        PasswordResetRequested::class => [
            SendPasswordResetListener::class,
        ],
    ];

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}

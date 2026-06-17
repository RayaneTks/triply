<?php

namespace App\Providers;

use App\Models\Etape;
use App\Models\Hebergement;
use App\Models\LocalTransport;
use App\Models\ShareLink;
use App\Models\Transport;
use App\Models\Voyage;
use App\Policies\ActivityPolicy;
use App\Policies\SharingPolicy;
use App\Policies\TravelPolicy;
use App\Policies\TripPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Voyage::class => TripPolicy::class,
        Etape::class => ActivityPolicy::class,
        Hebergement::class => TravelPolicy::class,
        Transport::class => TravelPolicy::class,
        LocalTransport::class => TravelPolicy::class,
        ShareLink::class => SharingPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}

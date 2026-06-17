<?php

namespace App\Providers;

use App\Console\Commands\SendTripRemindersCommand;
use App\Services\Contracts\ActivityServiceInterface;
use App\Services\Contracts\AiServiceInterface;
use App\Services\Contracts\AuthServiceInterface;
use App\Services\Contracts\BookingServiceInterface;
use App\Services\Contracts\ConsentServiceInterface;
use App\Services\Contracts\CurrencyConverterInterface;
use App\Services\Contracts\ExportServiceInterface;
use App\Services\Contracts\ObservabilityServiceInterface;
use App\Services\Contracts\PlacesServiceInterface;
use App\Services\Contracts\ProfileServiceInterface;
use App\Services\Contracts\RouteServiceInterface;
use App\Services\Contracts\SharingServiceInterface;
use App\Services\Contracts\SnapshotSyncServiceInterface;
use App\Services\Contracts\TravelServiceInterface;
use App\Services\Contracts\TripRecapServiceInterface;
use App\Services\Contracts\TripServiceInterface;
use App\Services\ActivityService;
use App\Services\AuthService;
use App\Services\CurrencyConverterService;
use App\Services\Geo\AmadeusCityCountryResolver;
use App\Services\Geo\CityCountryResolverInterface;
use App\Services\BookingService;
use App\Services\PlacesService;
use App\Services\ProfileService;
use App\Services\RouteService;
use App\Services\SnapshotSyncService;
use App\Services\TravelService;
use App\Services\TripRecapService;
use App\Services\TripService;
use App\Services\Stubs\AiServiceStub;
use App\Services\Stubs\ConsentServiceStub;
use App\Services\Stubs\ExportServiceStub;
use App\Services\ObservabilityService;
use App\Services\SharingService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AuthServiceInterface::class, AuthService::class);
        $this->app->bind(CurrencyConverterInterface::class, CurrencyConverterService::class);
        $this->app->bind(CityCountryResolverInterface::class, AmadeusCityCountryResolver::class);
        $this->app->bind(ProfileServiceInterface::class, ProfileService::class);
        $this->app->bind(SnapshotSyncServiceInterface::class, SnapshotSyncService::class);
        $this->app->bind(TripRecapServiceInterface::class, TripRecapService::class);
        $this->app->bind(RouteServiceInterface::class, RouteService::class);
        $this->app->bind(TripServiceInterface::class, TripService::class);
        $this->app->bind(ActivityServiceInterface::class, ActivityService::class);
        $this->app->bind(PlacesServiceInterface::class, PlacesService::class);
        // WIP — async AI job queue pas encore implémenté (retourne 202 stub)
        $this->app->bind(AiServiceInterface::class, AiServiceStub::class);
        $this->app->bind(TravelServiceInterface::class, TravelService::class);
        $this->app->bind(SharingServiceInterface::class, SharingService::class);
        // WIP — export PDF/ICS pas encore implémenté
        $this->app->bind(ExportServiceInterface::class, ExportServiceStub::class);
        // WIP — consentement cookie pas encore persisté
        $this->app->bind(ConsentServiceInterface::class, ConsentServiceStub::class);
        $this->app->bind(BookingServiceInterface::class, BookingService::class);
        $this->app->bind(ObservabilityServiceInterface::class, ObservabilityService::class);
    }

    public function boot(): void
    {
        $this->commands([
            SendTripRemindersCommand::class,
        ]);

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('ai', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('places', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}

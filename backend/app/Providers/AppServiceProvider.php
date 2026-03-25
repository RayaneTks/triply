<?php

namespace App\Providers;

use App\Console\Commands\SendTripRemindersCommand;
use App\Services\Contracts\ActivityServiceInterface;
use App\Services\Contracts\AiServiceInterface;
use App\Services\Contracts\AuthServiceInterface;
use App\Services\Contracts\BookingServiceInterface;
use App\Services\Contracts\ConsentServiceInterface;
use App\Services\Contracts\ExportServiceInterface;
use App\Services\Contracts\ObservabilityServiceInterface;
use App\Services\Contracts\PlacesServiceInterface;
use App\Services\Contracts\ProfileServiceInterface;
use App\Services\Contracts\SharingServiceInterface;
use App\Services\Contracts\TravelServiceInterface;
use App\Services\Contracts\TripServiceInterface;
use App\Services\AuthService;
use App\Services\ProfileService;
use App\Services\TripService;
use App\Services\Stubs\ActivityServiceStub;
use App\Services\Stubs\AiServiceStub;
use App\Services\Stubs\BookingServiceStub;
use App\Services\Stubs\ConsentServiceStub;
use App\Services\Stubs\ExportServiceStub;
use App\Services\Stubs\ObservabilityServiceStub;
use App\Services\Stubs\PlacesServiceStub;
use App\Services\Stubs\ProfileServiceStub;
use App\Services\Stubs\SharingServiceStub;
use App\Services\Stubs\TravelServiceStub;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AuthServiceInterface::class, AuthService::class);
        $this->app->bind(ProfileServiceInterface::class, ProfileService::class);
        $this->app->bind(TripServiceInterface::class, TripService::class);
        $this->app->bind(ActivityServiceInterface::class, ActivityServiceStub::class);
        $this->app->bind(PlacesServiceInterface::class, PlacesServiceStub::class);
        $this->app->bind(AiServiceInterface::class, AiServiceStub::class);
        $this->app->bind(TravelServiceInterface::class, TravelServiceStub::class);
        $this->app->bind(SharingServiceInterface::class, SharingServiceStub::class);
        $this->app->bind(ExportServiceInterface::class, ExportServiceStub::class);
        $this->app->bind(ConsentServiceInterface::class, ConsentServiceStub::class);
        $this->app->bind(BookingServiceInterface::class, BookingServiceStub::class);
        $this->app->bind(ObservabilityServiceInterface::class, ObservabilityServiceStub::class);
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

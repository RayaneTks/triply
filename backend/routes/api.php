<?php

use App\Http\Controllers\Api\V1\AdminMetricsController;
use App\Http\Controllers\Api\V1\AdminInsightsController;
use App\Http\Controllers\Api\V1\AdminTripsController;
use App\Http\Controllers\Api\V1\AiController;
use App\Http\Controllers\Api\V1\AdminUsersController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ConsentController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\Integrations\AmadeusFlightsProxyController;
use App\Http\Controllers\Api\V1\Integrations\AmadeusHotelsProxyController;
use App\Http\Controllers\Api\V1\Integrations\AmadeusIataLookupController;
use App\Http\Controllers\Api\V1\Integrations\AmadeusPlacesSearchController;
use App\Http\Controllers\Api\V1\Integrations\AssistantChatController;
use App\Http\Controllers\Api\V1\Integrations\GooglePlaceReviewsController;
use App\Http\Controllers\Api\V1\PlacesController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\RestaurantController;
use App\Http\Controllers\Api\V1\StripeWebhookController;
use App\Http\Controllers\Api\V1\SubscriptionController;
use App\Http\Controllers\Api\V1\TripActivityController;
use App\Http\Controllers\Api\V1\TripBookingController;
use App\Http\Controllers\Api\V1\TripBudgetController;
use App\Http\Controllers\Api\V1\TripController;
use App\Http\Controllers\Api\V1\TripDayController;
use App\Http\Controllers\Api\V1\TripExportController;
use App\Http\Controllers\Api\V1\TripFreeTimeController;
use App\Http\Controllers\Api\V1\TripRecapController;
use App\Http\Controllers\Api\V1\TripReplanController;
use App\Http\Controllers\Api\V1\TripRouteController;
use App\Http\Controllers\Api\V1\TripSharingController;
use App\Http\Controllers\Api\V1\TripTravelController;
use App\Http\Controllers\Api\V1\UserAccountController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', [HealthController::class, 'show']);

    /** Intégrations publiques (Amadeus lieux, avis lieu, lookup IATA) — clés côté serveur. */
    Route::prefix('integrations')->middleware('throttle:places')->group(function (): void {
        Route::get('/amadeus/places', [AmadeusPlacesSearchController::class, 'index']);
        Route::get('/google/place-reviews', [GooglePlaceReviewsController::class, 'index']);
        // Lookup IATA exposé en public : le wizard l'appelle avant login pour
        // résoudre la ville de départ. Pas de secret côté réponse, seulement
        // des codes IATA + coordonnées de villes publiques.
        Route::get('/amadeus/iata-lookup', [AmadeusIataLookupController::class, 'index']);
    });

    Route::middleware('auth:sanctum')->prefix('integrations')->group(function (): void {
        Route::post('/assistant', [AssistantChatController::class, 'store'])->middleware('throttle:ai');
        Route::match(['GET', 'POST'], '/amadeus/flights/search', [AmadeusFlightsProxyController::class, 'search'])->middleware('throttle:ai');
        Route::get('/amadeus/hotels/by-geocode', [AmadeusHotelsProxyController::class, 'index'])->middleware('throttle:ai');
        Route::match(['GET', 'POST'], '/amadeus/hotels/search', [AmadeusHotelsProxyController::class, 'search'])->middleware('throttle:ai');
    });

    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:password-reset');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:password-reset');
        Route::post('/email/verify', [AuthController::class, 'verifyEmail'])->middleware('throttle:password-reset');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });
    });

    Route::get('/share/{token}', [TripSharingController::class, 'showPublic'])->middleware('throttle:places');

    // Stripe webhook — public (signature header verifies authenticity).
    Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle'])
        ->middleware('throttle:60,1');

    Route::get('/consent', [ConsentController::class, 'show']);
    Route::post('/consent', [ConsentController::class, 'store']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::patch('/profile', [ProfileController::class, 'update']);
        Route::patch('/profile/preferences', [ProfileController::class, 'updatePreferences']);

        Route::get('/user/export', [UserAccountController::class, 'export'])->middleware('throttle:ai');
        Route::delete('/user', [UserAccountController::class, 'destroy']);

        Route::post('/trips', [TripController::class, 'store']);
        Route::get('/trips', [TripController::class, 'index']);
        Route::get('/trips/{trip}', [TripController::class, 'show']);
        Route::patch('/trips/{trip}', [TripController::class, 'update']);
        Route::delete('/trips/{trip}', [TripController::class, 'destroy']);
        Route::delete('/trips/{trip}/cities/{city}', [TripController::class, 'destroyCity'])
            ->where('city', '.*');
        Route::post('/trips/{trip}/duplicate', [TripController::class, 'duplicate']);
        Route::post('/trips/{trip}/validate', [TripController::class, 'validateTrip']);

        // Constraint Replanner — IA reécrit jours affectés en respectant locked etapes (preview only).
        Route::post('/trips/{trip}/replan', [TripReplanController::class, 'store'])->middleware('throttle:ai');

        // Budget Reshuffler — propose swap deterministe pour atteindre une cible d'économie.
        Route::post('/trips/{trip}/budget-reshuffle', [TripBudgetController::class, 'reshuffle']);

        Route::get('/trips/{trip}/days', [TripDayController::class, 'index']);
        Route::patch('/trips/{trip}/days/{day}', [TripDayController::class, 'update']);

        // Free-time Concierge — proposes walkable POIs for unused day capacity.
        Route::get('/trips/{trip}/days/{day}/free-time', [TripFreeTimeController::class, 'show'])
            ->where('day', '[0-9]+')
            ->middleware('throttle:places');

        Route::post('/trips/{trip}/activities', [TripActivityController::class, 'store']);
        Route::get('/trips/{trip}/activities', [TripActivityController::class, 'index']);
        Route::get('/trips/{trip}/activities/grouped-by-day', [TripActivityController::class, 'groupedByDay']);
        Route::get('/trips/{trip}/activities/{activity}', [TripActivityController::class, 'show']);
        Route::patch('/trips/{trip}/activities/{activity}', [TripActivityController::class, 'update']);
        Route::post('/trips/{trip}/activities/{activity}/regenerate', [TripActivityController::class, 'regenerate'])->middleware('throttle:ai');
        Route::post('/trips/{trip}/activities/reorder', [TripActivityController::class, 'reorder']);
        Route::delete('/trips/{trip}/activities/{activity}', [TripActivityController::class, 'destroy']);
        Route::post('/trips/{trip}/activities/{activity}/restore', [TripActivityController::class, 'restore']);

        Route::get('/places/{placeId}', [PlacesController::class, 'show'])->middleware('throttle:places');
        Route::get('/places/{placeId}/reviews', [PlacesController::class, 'reviews'])->middleware('throttle:places');

        Route::get('/trips/{trip}/routes', [TripRouteController::class, 'routes'])->middleware('throttle:places');
        Route::get('/trips/{trip}/travel-times', [TripRouteController::class, 'travelTimes'])->middleware('throttle:places');
        Route::get('/restaurants/nearby', [RestaurantController::class, 'nearby'])->middleware('throttle:places');

        Route::post('/ai/plan', [AiController::class, 'plan'])->middleware('throttle:ai');
        Route::post('/ai/trips/{trip}/days/{day}/generate', [AiController::class, 'generateDay'])->middleware('throttle:ai');
        Route::post('/ai/activities/{activity}/generate', [AiController::class, 'generateActivity'])->middleware('throttle:ai');
        Route::get('/ai/jobs/{jobId}', [AiController::class, 'jobStatus'])->middleware('throttle:ai');
        Route::post('/ai/jobs/{jobId}/cancel', [AiController::class, 'cancelJob'])->middleware('throttle:ai');
        Route::post('/ai/qa', [AiController::class, 'qa'])->middleware('throttle:ai');
        Route::post('/ai/branch', [AiController::class, 'branch'])->middleware('throttle:ai');

        Route::get('/trips/{trip}/flights', [TripTravelController::class, 'listFlights']);
        Route::post('/trips/{trip}/flights', [TripTravelController::class, 'storeFlight']);
        Route::patch('/trips/{trip}/flights/{flight}', [TripTravelController::class, 'updateFlight']);
        Route::delete('/trips/{trip}/flights/{flight}', [TripTravelController::class, 'deleteFlight']);

        Route::get('/trips/{trip}/hotels', [TripTravelController::class, 'listHotels']);
        Route::post('/trips/{trip}/hotels', [TripTravelController::class, 'storeHotel']);
        Route::patch('/trips/{trip}/hotels/{hotel}', [TripTravelController::class, 'updateHotel']);
        Route::delete('/trips/{trip}/hotels/{hotel}', [TripTravelController::class, 'deleteHotel']);

        Route::get('/trips/{trip}/local-transports', [TripTravelController::class, 'listLocalTransports']);
        Route::post('/trips/{trip}/local-transports', [TripTravelController::class, 'storeLocalTransport']);
        Route::patch('/trips/{trip}/local-transports/{localTransport}', [TripTravelController::class, 'updateLocalTransport']);
        Route::delete('/trips/{trip}/local-transports/{localTransport}', [TripTravelController::class, 'deleteLocalTransport']);

        Route::get('/trips/{trip}/recap', [TripRecapController::class, 'show']);
        Route::post('/trips/{trip}/share', [TripSharingController::class, 'create']);

        Route::post('/trips/{trip}/export/pdf', [TripExportController::class, 'exportPdf']);
        Route::post('/trips/{trip}/export/ics', [TripExportController::class, 'exportIcs']);

        Route::post('/trips/{trip}/booking/checkout', [TripBookingController::class, 'checkout']);

        Route::post('/subscriptions/confirm', [SubscriptionController::class, 'confirm']);

        Route::get('/admin/metrics', [AdminMetricsController::class, 'index'])->middleware('admin');
        Route::get('/admin/insights', [AdminInsightsController::class, 'index'])->middleware('admin');
        Route::get('/admin/users', [AdminUsersController::class, 'index'])->middleware('admin');
        Route::patch('/admin/users/{user}', [AdminUsersController::class, 'update'])->middleware('admin');
        Route::get('/admin/trips', [AdminTripsController::class, 'index'])->middleware('admin');
        Route::delete('/admin/trips/{trip}', [AdminTripsController::class, 'destroy'])->middleware('admin');
    });
});


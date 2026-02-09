<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Endpoint minimal de sante (utile pour checks infra et monitoring)
Route::get('/health', [HealthController::class, 'show']);

// API fonctionnelle versionnee: /api/v1/...
Route::prefix('v1')->group(function (): void {
    // Authentification
    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Utilisateurs
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::patch('/users/{id}', [UserController::class, 'update']);

    // Voyages
    Route::get('/trips', [TripController::class, 'index']);
    Route::post('/trips', [TripController::class, 'store']);
    Route::get('/trips/{id}', [TripController::class, 'show']);
    Route::patch('/trips/{id}', [TripController::class, 'update']);
    Route::delete('/trips/{id}', [TripController::class, 'destroy']);
    Route::post('/trips/{id}/publish', [TripController::class, 'publish']);

    // Reservations
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::patch('/bookings/{id}/status', [BookingController::class, 'updateStatus']);
    Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel']);

    // Paiements
    Route::post('/payments/intents', [PaymentController::class, 'createIntent']);
    Route::post('/payments/webhook', [PaymentController::class, 'webhook']);

    // Avis
    Route::get('/trips/{tripId}/reviews', [ReviewController::class, 'indexByTrip']);
    Route::post('/reviews', [ReviewController::class, 'store']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
});

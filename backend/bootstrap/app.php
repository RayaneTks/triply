<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\TrackRequestStart;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prependToGroup('api', TrackRequestStart::class);
        $middleware->appendToGroup('api', SecurityHeaders::class);

        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (ValidationException $exception, $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $errors = $exception->errors();
            $message = 'Requete invalide';
            foreach ($errors as $fieldErrors) {
                if (is_array($fieldErrors) && isset($fieldErrors[0]) && is_string($fieldErrors[0]) && $fieldErrors[0] !== '') {
                    $message = $fieldErrors[0];
                    break;
                }
            }

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => $message,
                    'details' => $errors,
                ],
            ], 422);
        });

        $exceptions->render(function (AuthenticationException $exception, $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'UNAUTHORIZED',
                    'message' => 'Authentification requise.',
                    'details' => (object) [],
                ],
            ], 401);
        });

        $exceptions->render(function (ModelNotFoundException $exception, $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Ressource introuvable.',
                    'details' => (object) [],
                ],
            ], 404);
        });

        $exceptions->render(function (HttpExceptionInterface $exception, $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $status = $exception->getStatusCode();
            $message = match ($status) {
                400 => 'Requete invalide.',
                403 => 'Acces refuse.',
                404 => 'Ressource introuvable.',
                405 => 'Methode HTTP non autorisee.',
                409 => 'Conflit detecte.',
                415 => 'Type de contenu non supporte.',
                429 => 'Trop de requetes. Reessayez plus tard.',
                default => 'Erreur HTTP.',
            };

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => strtoupper(str_replace(' ', '_', trim((string) preg_replace('/[^a-z0-9]+/i', ' ', $message)))),
                    'message' => $message,
                    'details' => (object) [],
                ],
            ], $status);
        });

        $exceptions->render(function (\Throwable $exception, $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            if ($exception instanceof HttpResponseException) {
                return null;
            }

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_SERVER_ERROR',
                    'message' => 'Une erreur interne est survenue.',
                    'details' => (object) [],
                ],
            ], 500);
        });
    })->create();

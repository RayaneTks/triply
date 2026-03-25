<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (! $user || ! (bool) ($user->est_admin ?? false)) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Acces reserve aux administrateurs.',
                    'details' => (object) [],
                ],
            ], 403);
        }

        return $next($request);
    }
}

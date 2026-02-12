<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackRequestStart
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('request_started_at_ns', hrtime(true));

        return $next($request);
    }
}


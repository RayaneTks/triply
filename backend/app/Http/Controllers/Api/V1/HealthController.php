<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HealthController extends ApiController
{
    public function show(Request $request): JsonResponse
    {
        $phpRequestStartedAt = $request->server->get('REQUEST_TIME_FLOAT');
        $phpTotalResponseTimeMs = is_numeric($phpRequestStartedAt)
            ? round((microtime(true) - (float) $phpRequestStartedAt) * 1000, 3)
            : null;

        $startedAtNs = $request->attributes->get('request_started_at_ns');
        $requestStartedAtNs = is_int($startedAtNs) ? $startedAtNs : hrtime(true);
        $applicationTimeMs = round((hrtime(true) - $requestStartedAtNs) / 1_000_000, 3);
        $responseTimeMs = $phpTotalResponseTimeMs ?? $applicationTimeMs;

        return $this->successResponse([
            'status' => 'ok',
            'service' => (string) config('app.name', 'Triply API'),
            'environment' => app()->environment(),
            'response_time_ms' => $responseTimeMs,
            'application_time_ms' => $applicationTimeMs,
            'target_response_time_ms' => 500,
            'within_target' => $responseTimeMs < 500,
            'timestamp' => now()->toISOString(),
        ]);
    }
}

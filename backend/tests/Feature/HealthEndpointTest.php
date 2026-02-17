<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    public function test_health_endpoint_returns_response_time_metrics(): void
    {
        $wallClockStartedAt = microtime(true);
        $response = $this->getJson('/api/v1/health');
        $wallClockMs = (microtime(true) - $wallClockStartedAt) * 1000;

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'data' => [
                'status',
                'service',
                'environment',
                'response_time_ms',
                'application_time_ms',
                'target_response_time_ms',
                'within_target',
                'timestamp',
            ],
            'meta',
        ]);

        $responseTimeMs = $response->json('data.response_time_ms');
        $applicationTimeMs = $response->json('data.application_time_ms');
        $targetMs = $response->json('data.target_response_time_ms');
        $withinTarget = (bool) $response->json('data.within_target');

        $this->assertIsNumeric($responseTimeMs);
        $this->assertIsNumeric($applicationTimeMs);
        $this->assertIsNumeric($targetMs);
        $this->assertGreaterThanOrEqual(0, (float) $responseTimeMs);
        $this->assertGreaterThanOrEqual(0, (float) $applicationTimeMs);
        $this->assertLessThanOrEqual($wallClockMs + 200, (float) $responseTimeMs, 'Health payload reports a value above measured wall clock.');
        $this->assertSame(((float) $responseTimeMs) < (float) $targetMs, $withinTarget);
    }
}

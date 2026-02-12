<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Endpoints techniques de health check / monitoring.
 *
 * Regroupe les routes qui permettent de verifier que l'API Triply est
 * en ligne et repond dans les delais attendus.
 */
final class V1HealthEndpoints
{
    /**
     * GET /api/v1/health
     *
     * Endpoint de supervision simple pour verifier la disponibilite
     * de l'API et exposer son temps de reponse en millisecondes.
     */
    #[OA\Get(
        path: '/health',
        tags: ['Health'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Health check successful',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'status' => 'ok',
                            'service' => 'Triply API',
                            'environment' => 'production',
                            'response_time_ms' => 12.3,
                            'target_response_time_ms' => 500,
                            'within_target' => true,
                            'timestamp' => '2026-02-11T16:11:00Z',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function health(): void {}
}

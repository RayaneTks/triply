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
            new OA\Response(response: 400, ref: '#/components/responses/ErrorBadRequest'),
            new OA\Response(response: 401, ref: '#/components/responses/ErrorUnauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/ErrorForbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/ErrorNotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ErrorValidation'),
            new OA\Response(response: 429, ref: '#/components/responses/ErrorRateLimited'),
            new OA\Response(response: 500, ref: '#/components/responses/ErrorInternal'),

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

<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Endpoints lies aux fonctionnalites IA.
 *
 * Generation de plan, de journees, d'activites et Q&A autour du voyage.
 */
final class V1AiEndpoints
{
    /**
     * POST /api/v1/ai/plan
     *
     * Demande a l'IA de generer un plan de voyage complet
     * a partir d'un prompt et de contraintes.
     */
    #[OA\Post(
        path: '/ai/plan',
        tags: ['IA'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'prompt' => 'Voyage 7 jours a Tokyo, budget modere, rythme medium',
                    'trip_id' => 'trip_stub_001',
                    'constraints' => ['max_budget' => 2200],
                ]
            )
        ),
        responses: [
            new OA\Response(response: 400, ref: '#/components/responses/ErrorBadRequest'),
            new OA\Response(response: 401, ref: '#/components/responses/ErrorUnauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/ErrorForbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/ErrorNotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ErrorValidation'),
            new OA\Response(response: 429, ref: '#/components/responses/ErrorRateLimited'),
            new OA\Response(response: 500, ref: '#/components/responses/ErrorInternal'),

            new OA\Response(
                response: 202,
                description: 'Generer un plan',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Generer un plan',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function aiPlan(): void {}

    /**
     * POST /api/v1/ai/trips/{trip}/days/{day}/generate
     *
     * Demande a l'IA de generer les activites d'une journee precise.
     */
    #[OA\Post(
        path: '/ai/trips/{trip}/days/{day}/generate',
        tags: ['IA'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'options' => [
                        'regenerate' => true,
                        'focus' => 'culture',
                    ],
                ]
            )
        ),
        responses: [
            new OA\Response(response: 400, ref: '#/components/responses/ErrorBadRequest'),
            new OA\Response(response: 401, ref: '#/components/responses/ErrorUnauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/ErrorForbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/ErrorNotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ErrorValidation'),
            new OA\Response(response: 429, ref: '#/components/responses/ErrorRateLimited'),
            new OA\Response(response: 500, ref: '#/components/responses/ErrorInternal'),

            new OA\Response(
                response: 202,
                description: 'Generer une journee',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Generer une journee',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function aiGenerateDay(): void {}

    /**
     * POST /api/v1/ai/activities/{activity}/generate
     *
     * Demande a l'IA une nouvelle proposition detaillee pour une activite.
     */
    #[OA\Post(
        path: '/ai/activities/{activity}/generate',
        tags: ['IA'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'context' => [
                        'reason' => 'Meteo pluvieuse',
                        'prefer_indoor' => true,
                    ],
                ]
            )
        ),
        responses: [
            new OA\Response(response: 400, ref: '#/components/responses/ErrorBadRequest'),
            new OA\Response(response: 401, ref: '#/components/responses/ErrorUnauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/ErrorForbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/ErrorNotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ErrorValidation'),
            new OA\Response(response: 429, ref: '#/components/responses/ErrorRateLimited'),
            new OA\Response(response: 500, ref: '#/components/responses/ErrorInternal'),

            new OA\Response(
                response: 202,
                description: 'Generer une activite',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Generer une activite',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function aiGenerateActivity(): void {}

    /**
     * GET /api/v1/ai/jobs/{jobId}
     *
     * Consulte le statut d'un job IA asynchrone (encours, termine, erreur...).
     */
    #[OA\Get(
        path: '/ai/jobs/{jobId}',
        tags: ['IA'],
        security: [['bearerAuth' => []]],
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
                description: 'Statut du job IA',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Statut du job IA',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function aiJobStatus(): void {}

    /**
     * POST /api/v1/ai/jobs/{jobId}/cancel
     *
     * Annule un job IA asynchrone encore en cours de traitement.
     */
    #[OA\Post(
        path: '/ai/jobs/{jobId}/cancel',
        tags: ['IA'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'todo' => 'Payload JSON provisoire (stub)',
                ]
            )
        ),
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
                description: 'Annuler le job IA',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Annuler le job IA',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function aiJobCancel(): void {}

    /**
     * POST /api/v1/ai/qa
     *
     * Pose une question libre a l'IA concernant le voyage.
     */
    #[OA\Post(
        path: '/ai/qa',
        tags: ['IA'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'question' => 'Que faire autour de Shibuya en 2h ?',
                    'trip_id' => 'trip_stub_001',
                    'conversation_id' => 'conv_stub_001',
                ]
            )
        ),
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
                description: 'Questions hors itineraire',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Questions hors itineraire',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function aiQa(): void {}

    /**
     * POST /api/v1/ai/branch
     *
     * Cree une nouvelle branche de conversation IA (fork d'un echange precedent).
     */
    #[OA\Post(
        path: '/ai/branch',
        tags: ['IA'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'conversation_id' => 'conv_stub_001',
                    'message_id' => 'msg_stub_009',
                    'reason' => 'Revenir a une proposition precedente',
                ]
            )
        ),
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
                description: 'Creer une branche de conversation',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Creer une branche de conversation',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function aiBranch(): void {}
}


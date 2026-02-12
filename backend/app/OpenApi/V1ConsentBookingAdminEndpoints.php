<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Endpoints complementaires : consentement, reservation et metriques admin.
 */
final class V1ConsentBookingAdminEndpoints
{
    /**
     * GET /api/v1/consent
     *
     * Retourne l'etat courant du consentement cookies / analytics.
     */
    #[OA\Get(
        path: '/consent',
        tags: ['Consentement'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Recuperer le consentement',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Recuperer le consentement',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function consentGet(): void {}

    /**
     * POST /api/v1/consent
     *
     * Enregistre les choix de consentement de l'utilisateur.
     */
    #[OA\Post(
        path: '/consent',
        tags: ['Consentement'],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'analytics' => true,
                    'marketing' => false,
                    'functional' => true,
                    'version' => '2026.01',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Enregistrer le consentement',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Enregistrer le consentement',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function consentPost(): void {}

    /**
     * POST /api/v1/trips/{trip}/booking/checkout
     *
     * Lance un processus de paiement / reservation (placeholder).
     */
    #[OA\Post(
        path: '/trips/{trip}/booking/checkout',
        tags: ['Reservation'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'provider' => 'stripe',
                    'currency' => 'EUR',
                    'amount' => 499.99,
                    'items' => [
                        [
                            'type' => 'hotel',
                            'id' => 'hotel_stub_001',
                        ],
                    ],
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 202,
                description: 'Paiement reservation (placeholder)',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Paiement reservation (placeholder)',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function bookingCheckout(): void {}

    /**
     * GET /api/v1/admin/metrics
     *
     * Retourne quelques metriques techniques / produit (admin uniquement).
     */
    #[OA\Get(
        path: '/admin/metrics',
        tags: ['Administration'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Metriques',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Metriques',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function metrics(): void {}
}


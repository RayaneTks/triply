<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Endpoints de partage et d'exports de voyages.
 *
 * Recap prive, partage public et exports PDF/ICS.
 */
final class V1SharingExportEndpoints
{
    /**
     * GET /api/v1/trips/{trip}/recap
     *
     * Retourne un recapitulatif complet du voyage (version privee).
     */
    #[OA\Get(
        path: '/trips/{trip}/recap',
        tags: ['Partage'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Recapitulatif du voyage',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Recapitulatif du voyage',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function recapPrivate(): void {}

    /**
     * POST /api/v1/trips/{trip}/share
     *
     * Cree un lien partageable (token) permettant d'acceder au recap public.
     */
    #[OA\Post(
        path: '/trips/{trip}/share',
        tags: ['Partage'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'expires_at' => '2026-07-01T00:00:00Z',
                    'password' => 'share1234',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Creer un lien de partage',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Creer un lien de partage',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function shareCreate(): void {}

    /**
     * GET /api/v1/share/{token}
     *
     * Affiche le recapitulatif public associe a un lien de partage.
     */
    #[OA\Get(
        path: '/share/{token}',
        tags: ['Partage'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Recapitulatif public',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Recapitulatif public',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function sharePublic(): void {}

    /**
     * POST /api/v1/trips/{trip}/export/pdf
     *
     * Genere (de facon synchrone ou asynchrone) un export PDF du voyage.
     */
    #[OA\Post(
        path: '/trips/{trip}/export/pdf',
        tags: ['Exports'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'locale' => 'fr',
                    'timezone' => 'Europe/Paris',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 202,
                description: 'Exporter en PDF',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Exporter en PDF',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function exportPdf(): void {}

    /**
     * POST /api/v1/trips/{trip}/export/ics
     *
     * Genere un export ICS (calendrier) des evenements du voyage.
     */
    #[OA\Post(
        path: '/trips/{trip}/export/ics',
        tags: ['Exports'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'locale' => 'fr',
                    'timezone' => 'Europe/Paris',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 202,
                description: 'Exporter en ICS',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Exporter en ICS',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function exportIcs(): void {}
}


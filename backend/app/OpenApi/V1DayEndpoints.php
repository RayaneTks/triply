<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Endpoints lies aux journees (`journees`).
 *
 * Permet de lister et modifier les jours d'un voyage.
 */
final class V1DayEndpoints
{
    /**
     * GET /api/v1/trips/{trip}/days
     *
     * Retourne la liste des journees liees a un voyage.
     */
    #[OA\Get(
        path: '/trips/{trip}/days',
        tags: ['Journees'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'trip', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lister les journees',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'journees' => [
                                [
                                    'id' => 10,
                                    'voyage_id' => 1,
                                    'date_jour' => '2026-06-11',
                                    'numero_jour' => 1,
                                ],
                                [
                                    'id' => 11,
                                    'voyage_id' => 1,
                                    'date_jour' => '2026-06-12',
                                    'numero_jour' => 2,
                                ],
                            ],
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function daysList(): void {}

    /**
     * PATCH /api/v1/trips/{trip}/days/{day}
     *
     * Met a jour la date / numero d'une journee.
     */
    #[OA\Patch(
        path: '/trips/{trip}/days/{day}',
        tags: ['Journees'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'trip', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'day', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'date_jour' => '2026-06-11',
                    'numero_jour' => 1,
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Mettre a jour la journee',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'journee' => [
                                'id' => 10,
                                'voyage_id' => 1,
                                'date_jour' => '2026-06-11',
                                'numero_jour' => 1,
                            ],
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function daysPatch(): void {}
}

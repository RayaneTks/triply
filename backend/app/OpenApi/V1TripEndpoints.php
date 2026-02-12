<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Endpoints lies aux voyages (`voyages`).
 *
 * Creation, listing, detail, mise a jour, duplication et validation de voyage.
 */
final class V1TripEndpoints
{
    /**
     * POST /api/v1/trips
     *
     * Cree un nouveau voyage pour l'utilisateur connecte
     * (ligne dans la table `voyages`).
     */
    #[OA\Post(
        path: '/trips',
        tags: ['Voyages'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                example: [
                    'titre' => 'Sejour a Tokyo',
                    'destination' => 'Tokyo',
                    'date_debut' => '2026-06-10',
                    'date_fin' => '2026-06-18',
                    'budget_total' => 2200,
                    'nb_voyageurs' => 2,
                    'description' => 'Decouverte de Tokyo en 8 jours',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Creer un voyage',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'voyage' => [
                                'id' => 1,
                                'titre' => 'Sejour a Tokyo',
                                'destination' => 'Tokyo',
                                'date_debut' => '2026-06-10',
                                'date_fin' => '2026-06-18',
                                'budget_total' => 2200,
                                'nb_voyageurs' => 2,
                                'description' => 'Decouverte de Tokyo en 8 jours',
                                'user_id' => 42,
                                'created_at' => '2026-02-11T10:00:00Z',
                                'updated_at' => '2026-02-11T10:00:00Z',
                            ],
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function tripStore(): void {}

    /**
     * GET /api/v1/trips
     *
     * Liste les voyages de l'utilisateur connecte.
     */
    #[OA\Get(
        path: '/trips',
        tags: ['Voyages'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lister les voyages',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'voyages' => [
                                [
                                    'id' => 1,
                                    'titre' => 'Sejour a Tokyo',
                                    'destination' => 'Tokyo',
                                    'date_debut' => '2026-06-10',
                                    'date_fin' => '2026-06-18',
                                    'budget_total' => 2200,
                                    'nb_voyageurs' => 2,
                                ],
                                [
                                    'id' => 2,
                                    'titre' => 'Roadtrip Espagne',
                                    'destination' => 'Barcelone',
                                    'date_debut' => '2026-08-01',
                                    'date_fin' => '2026-08-15',
                                    'budget_total' => 1800,
                                    'nb_voyageurs' => 4,
                                ],
                            ],
                        ],
                        'meta' => [
                            'total' => 2,
                        ],
                    ]
                )
            ),
        ]
    )]
    public function tripList(): void {}

    /**
     * GET /api/v1/trips/{trip}
     *
     * Retourne le detail d'un voyage (ligne de `voyages`).
     */
    #[OA\Get(
        path: '/trips/{trip}',
        tags: ['Voyages'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'trip', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Detail du voyage',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'voyage' => [
                                'id' => 1,
                                'titre' => 'Sejour a Tokyo',
                                'destination' => 'Tokyo',
                                'date_debut' => '2026-06-10',
                                'date_fin' => '2026-06-18',
                                'budget_total' => 2200,
                                'nb_voyageurs' => 2,
                                'description' => 'Decouverte de Tokyo en 8 jours',
                            ],
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function tripShow(): void {}

    /**
     * PATCH /api/v1/trips/{trip}
     *
     * Met a jour les informations d'un voyage existant.
     */
    #[OA\Patch(
        path: '/trips/{trip}',
        tags: ['Voyages'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'trip', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'titre' => 'Sejour a Tokyo (maj)',
                    'budget_total' => 2500,
                    'nb_voyageurs' => 3,
                    'description' => 'Voyage prolonge avec un ami',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Mettre a jour le voyage',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'voyage' => [
                                'id' => 1,
                                'titre' => 'Sejour a Tokyo (maj)',
                                'destination' => 'Tokyo',
                                'date_debut' => '2026-06-10',
                                'date_fin' => '2026-06-18',
                                'budget_total' => 2500,
                                'nb_voyageurs' => 3,
                            ],
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function tripUpdate(): void {}

    /**
     * POST /api/v1/trips/{trip}/duplicate
     *
     * Cree un nouveau voyage en dupliquant la configuration d'un voyage existant.
     */
    #[OA\Post(
        path: '/trips/{trip}/duplicate',
        tags: ['Voyages'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'trip', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'todo' => 'Payload JSON provisoire (stub)',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Dupliquer le voyage',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Dupliquer le voyage',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function tripDuplicate(): void {}

    /**
     * POST /api/v1/trips/{trip}/validate
     *
     * Marque un voyage comme valide / finalise (pret a etre reserve).
     */
    #[OA\Post(
        path: '/trips/{trip}/validate',
        tags: ['Voyages'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'trip', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'todo' => 'Payload JSON provisoire (stub)',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Valider le sejour',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Valider le sejour',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function tripValidate(): void {}
}


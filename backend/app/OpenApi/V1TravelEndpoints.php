<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Endpoints lies aux details de transport du voyage.
 *
 * Vols, hebergements et transports locaux lies a un voyage.
 */
final class V1TravelEndpoints
{
    /**
     * GET /api/v1/trips/{trip}/flights
     *
     * Liste les vols associes a un voyage.
     */
    #[OA\Get(
        path: '/trips/{trip}/flights',
        tags: ['Transports'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lister les vols',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Lister les vols',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function flightsList(): void {}

    /**
     * POST /api/v1/trips/{trip}/flights
     *
     * Ajoute un vol au planning de transport du voyage.
     */
    #[OA\Post(
        path: '/trips/{trip}/flights',
        tags: ['Transports'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'airline' => 'Air France',
                    'flight_number' => 'AF276',
                    'departure_at' => '2026-06-10T11:00:00Z',
                    'arrival_at' => '2026-06-11T03:30:00Z',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Ajouter un vol',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Ajouter un vol',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function flightsCreate(): void {}

    /**
     * PATCH /api/v1/trips/{trip}/flights/{flight}
     *
     * Met a jour les informations d'un vol existant.
     */
    #[OA\Patch(
        path: '/trips/{trip}/flights/{flight}',
        tags: ['Transports'],
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
            new OA\Response(
                response: 200,
                description: 'Mettre a jour le vol',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Mettre a jour le vol',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function flightsUpdate(): void {}

    /**
     * DELETE /api/v1/trips/{trip}/flights/{flight}
     *
     * Supprime un vol du voyage.
     */
    #[OA\Delete(
        path: '/trips/{trip}/flights/{flight}',
        tags: ['Transports'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Supprimer le vol',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Supprimer le vol',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function flightsDelete(): void {}

    /**
     * GET /api/v1/trips/{trip}/hotels
     *
     * Liste les hebergements associes a un voyage.
     */
    #[OA\Get(
        path: '/trips/{trip}/hotels',
        tags: ['Transports'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lister les hebergements',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Lister les hebergements',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function hotelsList(): void {}

    /**
     * POST /api/v1/trips/{trip}/hotels
     *
     * Ajoute un hebergement au voyage (hotel, airbnb...).
     */
    #[OA\Post(
        path: '/trips/{trip}/hotels',
        tags: ['Transports'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'name' => 'Hotel Shinjuku',
                    'address' => '1-2-3 Shinjuku, Tokyo',
                    'check_in' => '2026-06-11',
                    'check_out' => '2026-06-18',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Ajouter un hebergement',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Ajouter un hebergement',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function hotelsCreate(): void {}

    /**
     * PATCH /api/v1/trips/{trip}/hotels/{hotel}
     *
     * Met a jour les informations d'un hebergement.
     */
    #[OA\Patch(
        path: '/trips/{trip}/hotels/{hotel}',
        tags: ['Transports'],
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
            new OA\Response(
                response: 200,
                description: 'Mettre a jour l\'hebergement',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Mettre a jour l\'hebergement',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function hotelsUpdate(): void {}

    /**
     * DELETE /api/v1/trips/{trip}/hotels/{hotel}
     *
     * Supprime un hebergement du voyage.
     */
    #[OA\Delete(
        path: '/trips/{trip}/hotels/{hotel}',
        tags: ['Transports'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Supprimer l\'hebergement',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Supprimer l\'hebergement',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function hotelsDelete(): void {}

    /**
     * GET /api/v1/trips/{trip}/local-transports
     *
     * Liste les transports locaux (metro, bus, taxi...) du voyage.
     */
    #[OA\Get(
        path: '/trips/{trip}/local-transports',
        tags: ['Transports'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lister les transports locaux',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Lister les transports locaux',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function localTransportsList(): void {}

    /**
     * POST /api/v1/trips/{trip}/local-transports
     *
     * Ajoute un transport local entre deux lieux du voyage.
     */
    #[OA\Post(
        path: '/trips/{trip}/local-transports',
        tags: ['Transports'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'type' => 'metro',
                    'from' => 'Shibuya',
                    'to' => 'Asakusa',
                    'departure_at' => '2026-06-12T08:30:00Z',
                    'arrival_at' => '2026-06-12T09:10:00Z',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Ajouter un transport local',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Ajouter un transport local',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function localTransportsCreate(): void {}

    /**
     * PATCH /api/v1/trips/{trip}/local-transports/{localTransport}
     *
     * Met a jour les informations d'un transport local existant.
     */
    #[OA\Patch(
        path: '/trips/{trip}/local-transports/{localTransport}',
        tags: ['Transports'],
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
            new OA\Response(
                response: 200,
                description: 'Mettre a jour le transport local',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Mettre a jour le transport local',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function localTransportsUpdate(): void {}

    /**
     * DELETE /api/v1/trips/{trip}/local-transports/{localTransport}
     *
     * Supprime un transport local du voyage.
     */
    #[OA\Delete(
        path: '/trips/{trip}/local-transports/{localTransport}',
        tags: ['Transports'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Supprimer le transport local',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Supprimer le transport local',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function localTransportsDelete(): void {}
}


<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Endpoints lies aux lieux, cartes et recommandations.
 *
 * Utilises pour recuperer les details d'un lieu, des avis, les itineraires
 * et les restaurants a proximite.
 */
final class V1PlaceEndpoints
{
    /**
     * GET /api/v1/places/{placeId}
     *
     * Retourne les informations detaillees d'un lieu externe (ex: Google Places).
     */
    #[OA\Get(
        path: '/places/{placeId}',
        tags: ['Lieux'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Details du lieu',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Details du lieu',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function placeShow(): void {}

    /**
     * GET /api/v1/places/{placeId}/reviews
     *
     * Retourne les avis associes a un lieu externe.
     */
    #[OA\Get(
        path: '/places/{placeId}/reviews',
        tags: ['Lieux'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Avis du lieu',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Avis du lieu',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function placeReviews(): void {}

    /**
     * GET /api/v1/trips/{trip}/routes
     *
     * Calcule les itineraires (polylines) du voyage en fonction des activites.
     */
    #[OA\Get(
        path: '/trips/{trip}/routes',
        tags: ['Lieux'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Itineraires du voyage',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Itineraires du voyage',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function tripRoutes(): void {}

    /**
     * GET /api/v1/trips/{trip}/travel-times
     *
     * Retourne les temps de trajets entre les differentes etapes du voyage.
     */
    #[OA\Get(
        path: '/trips/{trip}/travel-times',
        tags: ['Lieux'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Temps de trajet',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Temps de trajet',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function tripTravelTimes(): void {}

    /**
     * GET /api/v1/restaurants/nearby
     *
     * Retourne une liste de restaurants a proximite de la position donnee.
     */
    #[OA\Get(
        path: '/restaurants/nearby',
        tags: ['Lieux'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Restaurants a proximite',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Restaurants a proximite',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function restaurantsNearby(): void {}
}


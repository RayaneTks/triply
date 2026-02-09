<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class ReviewController extends Controller
{
    #[OA\Get(
        path: '/api/v1/trips/{tripId}/reviews',
        summary: 'Lister les avis pour un voyage',
        tags: ['Avis'],
        parameters: [
            new OA\Parameter(name: 'tripId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Liste des avis',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: 'id', type: 'integer', example: 1),
                                    new OA\Property(property: 'rating', type: 'integer', example: 5),
                                    new OA\Property(property: 'comment', type: 'string', example: 'Super voyage'),
                                ]
                            )
                        ),
                    ]
                )
            ),
        ]
    )]
    public function indexByTrip(int $tripId): JsonResponse
    {
        return response()->json([
            'data' => [
                ['id' => 1, 'rating' => 5, 'comment' => 'Super voyage', 'trip_id' => $tripId],
            ],
        ]);
    }

    #[OA\Post(
        path: '/api/v1/reviews',
        summary: 'Creer un avis',
        tags: ['Avis'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['booking_id', 'rating'],
                properties: [
                    new OA\Property(property: 'booking_id', type: 'integer', example: 100),
                    new OA\Property(property: 'rating', type: 'integer', example: 5),
                    new OA\Property(property: 'comment', type: 'string', example: 'Excellent hote'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Avis cree',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: "Endpoint d'avis pret"),
                    ]
                )
            ),
        ]
    )]
    public function store(): JsonResponse
    {
        return response()->json(['message' => "Endpoint d'avis pret"], 201);
    }
}

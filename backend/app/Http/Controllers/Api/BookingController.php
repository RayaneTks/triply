<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class BookingController extends Controller
{
    #[OA\Get(
        path: '/api/v1/bookings',
        summary: 'Lister les reservations',
        tags: ['Reservations'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Liste des reservations',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: 'id', type: 'integer', example: 100),
                                    new OA\Property(property: 'trip_id', type: 'integer', example: 10),
                                    new OA\Property(property: 'status', type: 'string', example: 'pending'),
                                ]
                            )
                        ),
                    ]
                )
            ),
        ]
    )]
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                ['id' => 100, 'trip_id' => 10, 'status' => 'pending'],
            ],
        ]);
    }

    #[OA\Post(
        path: '/api/v1/bookings',
        summary: 'Creer une reservation',
        tags: ['Reservations'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['trip_id', 'participants'],
                properties: [
                    new OA\Property(property: 'trip_id', type: 'integer', example: 10),
                    new OA\Property(property: 'participants', type: 'integer', example: 2),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Reservation creee',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Endpoint de creation de reservation pret'),
                    ]
                )
            ),
        ]
    )]
    public function store(): JsonResponse
    {
        return response()->json(['message' => 'Endpoint de creation de reservation pret'], 201);
    }

    #[OA\Get(
        path: '/api/v1/bookings/{id}',
        summary: "Recuperer les details d'une reservation",
        tags: ['Reservations'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Details de la reservation',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'id', type: 'integer', example: 100),
                        new OA\Property(property: 'trip_id', type: 'integer', example: 10),
                        new OA\Property(property: 'status', type: 'string', example: 'confirmed'),
                    ]
                )
            ),
        ]
    )]
    public function show(int $id): JsonResponse
    {
        return response()->json([
            'id' => $id,
            'trip_id' => 10,
            'status' => 'confirmed',
        ]);
    }

    #[OA\Patch(
        path: '/api/v1/bookings/{id}/status',
        summary: "Mettre a jour le statut d'une reservation",
        tags: ['Reservations'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', example: 'confirmed'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Statut mis a jour',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Endpoint de statut de reservation pret'),
                    ]
                )
            ),
        ]
    )]
    public function updateStatus(int $id): JsonResponse
    {
        return response()->json(['message' => "Endpoint de statut de reservation {$id} pret"]);
    }

    #[OA\Post(
        path: '/api/v1/bookings/{id}/cancel',
        summary: 'Annuler une reservation',
        tags: ['Reservations'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Reservation annulee',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: "Endpoint d'annulation de reservation pret"),
                    ]
                )
            ),
        ]
    )]
    public function cancel(int $id): JsonResponse
    {
        return response()->json(['message' => "Endpoint d'annulation de reservation {$id} pret"]);
    }
}

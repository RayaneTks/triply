<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class TripController extends Controller
{
    #[OA\Get(
        path: '/api/v1/trips',
        summary: 'Lister les voyages',
        tags: ['Voyages'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Liste des voyages',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: 'id', type: 'integer', example: 10),
                                    new OA\Property(property: 'title', type: 'string', example: 'Week-end a Rome'),
                                    new OA\Property(property: 'status', type: 'string', example: 'draft'),
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
                ['id' => 10, 'title' => 'Week-end a Rome', 'status' => 'draft'],
            ],
        ]);
    }

    #[OA\Post(
        path: '/api/v1/trips',
        summary: 'Creer un voyage',
        tags: ['Voyages'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['title', 'destination'],
                properties: [
                    new OA\Property(property: 'title', type: 'string', example: 'Week-end a Rome'),
                    new OA\Property(property: 'destination', type: 'string', example: 'Rome'),
                    new OA\Property(property: 'price', type: 'number', format: 'float', example: 299.99),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Voyage cree',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Endpoint de creation de voyage pret'),
                    ]
                )
            ),
        ]
    )]
    public function store(): JsonResponse
    {
        return response()->json(['message' => 'Endpoint de creation de voyage pret'], 201);
    }

    #[OA\Get(
        path: '/api/v1/trips/{id}',
        summary: "Recuperer les details d'un voyage",
        tags: ['Voyages'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Details du voyage',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'id', type: 'integer', example: 10),
                        new OA\Property(property: 'title', type: 'string', example: 'Week-end a Rome'),
                        new OA\Property(property: 'description', type: 'string', example: 'Sejour urbain de 3 jours'),
                    ]
                )
            ),
        ]
    )]
    public function show(int $id): JsonResponse
    {
        return response()->json([
            'id' => $id,
            'title' => 'Week-end a Rome',
            'description' => 'Sejour urbain de 3 jours',
        ]);
    }

    #[OA\Patch(
        path: '/api/v1/trips/{id}',
        summary: 'Mettre a jour un voyage',
        tags: ['Voyages'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'title', type: 'string', example: 'Titre de voyage mis a jour'),
                    new OA\Property(property: 'price', type: 'number', format: 'float', example: 349.99),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Voyage mis a jour',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Endpoint de mise a jour de voyage pret'),
                    ]
                )
            ),
        ]
    )]
    public function update(int $id): JsonResponse
    {
        return response()->json(['message' => "Endpoint de mise a jour de voyage {$id} pret"]);
    }

    #[OA\Delete(
        path: '/api/v1/trips/{id}',
        summary: 'Supprimer un voyage',
        tags: ['Voyages'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Voyage supprime',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Endpoint de suppression de voyage pret'),
                    ]
                )
            ),
        ]
    )]
    public function destroy(int $id): JsonResponse
    {
        return response()->json(['message' => "Endpoint de suppression de voyage {$id} pret"]);
    }

    #[OA\Post(
        path: '/api/v1/trips/{id}/publish',
        summary: 'Publier un voyage',
        tags: ['Voyages'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Voyage publie',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Endpoint de publication de voyage pret'),
                    ]
                )
            ),
        ]
    )]
    public function publish(int $id): JsonResponse
    {
        return response()->json(['message' => "Endpoint de publication de voyage {$id} pret"]);
    }
}

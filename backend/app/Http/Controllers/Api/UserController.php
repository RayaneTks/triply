<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class UserController extends Controller
{
    #[OA\Get(
        path: '/api/v1/users',
        summary: 'Lister les utilisateurs',
        tags: ['Utilisateurs'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Liste des utilisateurs',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: 'id', type: 'integer', example: 1),
                                    new OA\Property(property: 'name', type: 'string', example: 'Rayan'),
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
                ['id' => 1, 'name' => 'Rayan'],
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/v1/users/{id}',
        summary: 'Recuperer un profil utilisateur',
        tags: ['Utilisateurs'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Details utilisateur',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'id', type: 'integer', example: 1),
                        new OA\Property(property: 'name', type: 'string', example: 'Rayan'),
                        new OA\Property(property: 'bio', type: 'string', example: 'Voyageur et hote'),
                    ]
                )
            ),
        ]
    )]
    public function show(int $id): JsonResponse
    {
        return response()->json([
            'id' => $id,
            'name' => 'Rayan',
            'bio' => 'Voyageur et hote',
        ]);
    }

    #[OA\Patch(
        path: '/api/v1/users/{id}',
        summary: 'Mettre a jour un profil utilisateur',
        tags: ['Utilisateurs'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Rayan K.'),
                    new OA\Property(property: 'bio', type: 'string', example: 'Hote a Paris'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Profil mis a jour',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Endpoint de mise a jour utilisateur pret'),
                    ]
                )
            ),
        ]
    )]
    public function update(int $id): JsonResponse
    {
        return response()->json([
            'message' => "Endpoint de mise a jour utilisateur {$id} pret",
        ]);
    }
}

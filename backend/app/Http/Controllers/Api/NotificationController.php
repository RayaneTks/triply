<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class NotificationController extends Controller
{
    #[OA\Get(
        path: '/api/v1/notifications',
        summary: 'Lister les notifications',
        tags: ['Notifications'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Liste des notifications',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: 'id', type: 'integer', example: 1),
                                    new OA\Property(property: 'title', type: 'string', example: 'Nouvelle reservation'),
                                    new OA\Property(property: 'is_read', type: 'boolean', example: false),
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
                ['id' => 1, 'title' => 'Nouvelle reservation', 'is_read' => false],
            ],
        ]);
    }

    #[OA\Patch(
        path: '/api/v1/notifications/{id}/read',
        summary: 'Marquer une notification comme lue',
        tags: ['Notifications'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notification mise a jour',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Endpoint de lecture de notification pret'),
                    ]
                )
            ),
        ]
    )]
    public function markAsRead(int $id): JsonResponse
    {
        return response()->json(['message' => "Endpoint de lecture de notification {$id} pret"]);
    }

    #[OA\Patch(
        path: '/api/v1/notifications/read-all',
        summary: 'Marquer toutes les notifications comme lues',
        tags: ['Notifications'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notifications mises a jour',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Endpoint de lecture globale des notifications pret'),
                    ]
                )
            ),
        ]
    )]
    public function markAllAsRead(): JsonResponse
    {
        return response()->json(['message' => 'Endpoint de lecture globale des notifications pret']);
    }
}

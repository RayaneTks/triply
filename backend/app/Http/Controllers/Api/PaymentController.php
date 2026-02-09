<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class PaymentController extends Controller
{
    #[OA\Post(
        path: '/api/v1/payments/intents',
        summary: 'Creer une intention de paiement',
        tags: ['Paiements'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['booking_id', 'amount'],
                properties: [
                    new OA\Property(property: 'booking_id', type: 'integer', example: 100),
                    new OA\Property(property: 'amount', type: 'number', format: 'float', example: 299.99),
                    new OA\Property(property: 'currency', type: 'string', example: 'EUR'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Intention de paiement creee',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: "Endpoint d'intention de paiement pret"),
                        new OA\Property(property: 'client_secret', type: 'string', example: 'pi_secret_placeholder'),
                    ]
                )
            ),
        ]
    )]
    public function createIntent(): JsonResponse
    {
        return response()->json([
            'message' => "Endpoint d'intention de paiement pret",
            'client_secret' => 'pi_secret_placeholder',
        ]);
    }

    #[OA\Post(
        path: '/api/v1/payments/webhook',
        summary: 'Traiter le webhook du prestataire de paiement',
        tags: ['Paiements'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Webhook accepte',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'received', type: 'boolean', example: true),
                    ]
                )
            ),
        ]
    )]
    public function webhook(): JsonResponse
    {
        return response()->json(['received' => true]);
    }
}

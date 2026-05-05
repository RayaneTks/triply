<?php

namespace App\Http\Controllers\Api\V1\Integrations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Services\Integrations\ChatAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Assistant conversationnel (OpenAI + Amadeus géocode) — secrets serveur uniquement.
 */
class AssistantChatController extends ApiController
{
    public function store(Request $request, ChatAssistantService $assistant): JsonResponse
    {
        $payload = $assistant->handle($request->all());
        $status = (int) ($payload['_httpStatus'] ?? 200);
        unset($payload['_httpStatus']);

        if ($status >= 400) {
            $message = is_string($payload['error'] ?? null) ? $payload['error'] : 'Erreur assistant.';

            return $this->errorResponse('ASSISTANT_ERROR', $message, [], $status);
        }

        return $this->successResponse($payload);
    }
}

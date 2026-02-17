<?php

namespace App\Http\Requests\Api\V1\AI;

use App\Http\Requests\Api\V1\BaseApiRequest;

class QaRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'question' => ['required', 'string', 'max:2000'],
            'trip_id' => ['nullable', 'string'],
            'conversation_id' => ['nullable', 'string'],
        ];
    }
}

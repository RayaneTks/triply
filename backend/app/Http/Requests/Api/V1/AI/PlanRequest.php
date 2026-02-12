<?php

namespace App\Http\Requests\Api\V1\AI;

use App\Http\Requests\Api\V1\BaseApiRequest;

class PlanRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'prompt' => ['required', 'string', 'max:4000'],
            'trip_id' => ['nullable', 'string'],
            'constraints' => ['nullable', 'array'],
        ];
    }
}

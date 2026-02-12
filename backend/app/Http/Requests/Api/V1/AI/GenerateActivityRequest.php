<?php

namespace App\Http\Requests\Api\V1\AI;

use App\Http\Requests\Api\V1\BaseApiRequest;

class GenerateActivityRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'context' => ['nullable', 'array'],
        ];
    }
}

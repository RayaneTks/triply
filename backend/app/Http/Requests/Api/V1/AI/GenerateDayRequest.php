<?php

namespace App\Http\Requests\Api\V1\AI;

use App\Http\Requests\Api\V1\BaseApiRequest;

class GenerateDayRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'options' => ['nullable', 'array'],
        ];
    }
}

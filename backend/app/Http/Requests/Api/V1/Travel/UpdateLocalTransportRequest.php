<?php

namespace App\Http\Requests\Api\V1\Travel;

use App\Http\Requests\Api\V1\BaseApiRequest;

class UpdateLocalTransportRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'type' => ['sometimes', 'string', 'max:100'],
            'from' => ['sometimes', 'string', 'max:150'],
            'to' => ['sometimes', 'string', 'max:150'],
            'departure_at' => ['sometimes', 'date'],
            'arrival_at' => ['sometimes', 'date'],
        ];
    }
}

<?php

namespace App\Http\Requests\Api\V1\Travel;

use App\Http\Requests\Api\V1\BaseApiRequest;

class UpdateLocalTransportRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'type' => ['sometimes', 'string', 'max:50'],
            'from' => ['sometimes', 'string', 'max:191'],
            'to' => ['sometimes', 'string', 'max:191'],
            'departure_at' => ['sometimes', 'nullable', 'date'],
            'arrival_at' => ['sometimes', 'nullable', 'date'],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'nullable', 'string', 'max:8'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}

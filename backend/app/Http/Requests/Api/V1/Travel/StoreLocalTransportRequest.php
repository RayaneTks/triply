<?php

namespace App\Http\Requests\Api\V1\Travel;

use App\Http\Requests\Api\V1\BaseApiRequest;

class StoreLocalTransportRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'max:100'],
            'from' => ['required', 'string', 'max:150'],
            'to' => ['required', 'string', 'max:150'],
            'departure_at' => ['nullable', 'date'],
            'arrival_at' => ['nullable', 'date'],
        ];
    }
}

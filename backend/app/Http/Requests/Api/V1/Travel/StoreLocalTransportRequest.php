<?php

namespace App\Http\Requests\Api\V1\Travel;

use App\Http\Requests\Api\V1\BaseApiRequest;

class StoreLocalTransportRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'max:50'],
            'from' => ['required', 'string', 'max:191'],
            'to' => ['required', 'string', 'max:191'],
            'departure_at' => ['nullable', 'date'],
            'arrival_at' => ['nullable', 'date'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}

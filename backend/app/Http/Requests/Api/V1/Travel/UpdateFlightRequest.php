<?php

namespace App\Http\Requests\Api\V1\Travel;

use App\Http\Requests\Api\V1\BaseApiRequest;

class UpdateFlightRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'airline' => ['sometimes', 'string', 'max:120'],
            'flight_number' => ['sometimes', 'string', 'max:50'],
            'departure_at' => ['sometimes', 'date'],
            'arrival_at' => ['sometimes', 'date'],
        ];
    }
}

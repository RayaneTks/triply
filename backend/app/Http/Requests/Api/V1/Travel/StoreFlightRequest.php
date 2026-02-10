<?php

namespace App\Http\Requests\Api\V1\Travel;

use App\Http\Requests\Api\V1\BaseApiRequest;

class StoreFlightRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'airline' => ['required', 'string', 'max:120'],
            'flight_number' => ['required', 'string', 'max:50'],
            'departure_at' => ['required', 'date'],
            'arrival_at' => ['required', 'date'],
        ];
    }
}

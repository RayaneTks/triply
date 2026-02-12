<?php

namespace App\Http\Requests\Api\V1\Trips;

use App\Http\Requests\Api\V1\BaseApiRequest;

class StoreTripRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'destination' => ['required', 'string', 'max:150'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'travelers_count' => ['nullable', 'integer', 'min:1'],
        ];
    }
}

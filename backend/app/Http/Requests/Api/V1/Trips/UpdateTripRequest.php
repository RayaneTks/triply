<?php

namespace App\Http\Requests\Api\V1\Trips;

use App\Http\Requests\Api\V1\BaseApiRequest;

class UpdateTripRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:150'],
            'departure_location' => ['sometimes', 'string', 'max:150'],
            'arrival_location' => ['sometimes', 'string', 'max:150'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date'],
            'travelers_count' => ['sometimes', 'integer', 'min:1'],
            'timezone' => ['sometimes', 'string', 'max:64'],
            'day_start_time' => ['sometimes', 'date_format:H:i'],
            'day_end_time' => ['sometimes', 'date_format:H:i'],
            'max_budget' => ['sometimes', 'numeric', 'min:0'],
            'budget_breakdown' => ['sometimes', 'array'],
            'breakfast_included' => ['sometimes', 'boolean'],
        ];
    }
}

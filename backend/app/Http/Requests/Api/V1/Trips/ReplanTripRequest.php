<?php

namespace App\Http\Requests\Api\V1\Trips;

use App\Http\Requests\Api\V1\BaseApiRequest;

class ReplanTripRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'in:flight_delay,weather,health,over_budget,time_lost,other'],
            'details' => ['nullable', 'string', 'max:1000'],
            'locked_activity_ids' => ['nullable', 'array'],
            'locked_activity_ids.*' => ['string'],
            'affected_days' => ['nullable', 'array'],
            'affected_days.*' => ['integer', 'min:1', 'max:365'],
        ];
    }
}

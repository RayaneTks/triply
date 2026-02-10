<?php

namespace App\Http\Requests\Api\V1\Places;

use App\Http\Requests\Api\V1\BaseApiRequest;

class NearbyRestaurantsRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'lat' => ['required', 'numeric'],
            'lng' => ['required', 'numeric'],
            'radius' => ['nullable', 'integer', 'min:1', 'max:50000'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}

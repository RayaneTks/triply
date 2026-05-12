<?php

namespace App\Http\Requests\Api\V1\Places;

use App\Http\Requests\Api\V1\BaseApiRequest;

class NearbyRestaurantsRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'lat' => ['nullable', 'numeric', 'required_without:activity_id'],
            'lng' => ['nullable', 'numeric', 'required_without:activity_id'],
            'radius' => ['nullable', 'integer', 'min:1', 'max:50000'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
            'activity_id' => ['nullable', 'string'],
        ];
    }
}

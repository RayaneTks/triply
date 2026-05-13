<?php

namespace App\Http\Requests\Api\V1\Travel;

use App\Http\Requests\Api\V1\BaseApiRequest;

class UpdateFlightRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'type' => ['sometimes', 'string', 'max:128'],
            'depart_lieu' => ['sometimes', 'string', 'max:255'],
            'arrivee_lieu' => ['sometimes', 'string', 'max:255'],
            'depart_le' => ['sometimes', 'date'],
            'arrivee_le' => ['sometimes', 'date'],
            'prix' => ['sometimes', 'integer', 'min:0'],
            'devise' => ['nullable', 'string', 'size:3'],
            'information_supplementaire' => ['nullable', 'string', 'max:5000'],
        ];
    }
}

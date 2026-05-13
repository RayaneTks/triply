<?php

namespace App\Http\Requests\Api\V1\Travel;

use App\Http\Requests\Api\V1\BaseApiRequest;

class UpdateHotelRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'type' => ['sometimes', 'string', 'max:128'],
            'nom' => ['sometimes', 'string', 'max:255'],
            'adresse' => ['sometimes', 'string', 'max:500'],
            'code_postal' => ['nullable', 'string', 'max:32'],
            'ville' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'arrivee_le' => ['sometimes', 'date'],
            'depart_le' => ['sometimes', 'date'],
            'prix' => ['sometimes', 'integer', 'min:0'],
            'devise' => ['nullable', 'string', 'size:3'],
            'informations_supplementaire' => ['nullable', 'string', 'max:5000'],
        ];
    }
}

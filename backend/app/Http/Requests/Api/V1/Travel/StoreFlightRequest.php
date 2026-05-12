<?php

namespace App\Http\Requests\Api\V1\Travel;

use App\Http\Requests\Api\V1\BaseApiRequest;

class StoreFlightRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'max:128'],
            'depart_lieu' => ['required', 'string', 'max:255'],
            'arrivee_lieu' => ['required', 'string', 'max:255'],
            'depart_le' => ['required', 'date'],
            'arrivee_le' => ['required', 'date', 'after_or_equal:depart_le'],
            'prix' => ['required', 'integer', 'min:0'],
            'devise' => ['nullable', 'string', 'size:3'],
            'information_supplementaire' => ['nullable', 'string', 'max:5000'],
        ];
    }
}

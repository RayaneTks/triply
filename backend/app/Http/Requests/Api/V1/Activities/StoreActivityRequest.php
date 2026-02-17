<?php

namespace App\Http\Requests\Api\V1\Activities;

use App\Http\Requests\Api\V1\BaseApiRequest;

class StoreActivityRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'source' => ['required', 'string', 'in:manual,place,ai'],
            'title' => ['nullable', 'string', 'max:150'],
            'place_id' => ['nullable', 'string', 'max:200'],
            'estimated_duration_minutes' => ['nullable', 'integer', 'min:5'],
            'day_id' => ['nullable', 'string'],
            'start_at' => ['nullable', 'date'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'type' => ['nullable', 'string', 'max:100'],
        ];
    }
}

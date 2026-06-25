<?php

namespace App\Http\Requests\Api\V1\Activities;

use App\Http\Requests\Api\V1\BaseApiRequest;

class UpdateActivityRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:150'],
            'estimated_duration_minutes' => ['sometimes', 'integer', 'min:5'],
            'start_at' => ['sometimes', 'date'],
            'liked_state' => ['sometimes', 'string', 'in:liked,disliked,neutral'],
            'cost' => ['sometimes', 'numeric', 'min:0'],
            'type' => ['sometimes', 'string', 'max:100'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'lat' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'lng' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'layer_id' => ['sometimes', 'nullable', 'string', 'max:200'],
        ];
    }
}

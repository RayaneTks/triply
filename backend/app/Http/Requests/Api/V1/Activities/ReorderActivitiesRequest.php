<?php

namespace App\Http\Requests\Api\V1\Activities;

use App\Http\Requests\Api\V1\BaseApiRequest;

class ReorderActivitiesRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'activity_ids' => ['required', 'array', 'min:1'],
            'activity_ids.*' => ['string'],
            'day_id' => ['nullable', 'string'],
        ];
    }
}

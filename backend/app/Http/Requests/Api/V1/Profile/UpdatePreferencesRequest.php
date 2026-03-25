<?php

namespace App\Http\Requests\Api\V1\Profile;

use App\Http\Requests\Api\V1\BaseApiRequest;

class UpdatePreferencesRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'diet' => ['sometimes', 'array'],
            'breakfast_included' => ['sometimes', 'boolean'],
            'interests' => ['sometimes', 'array'],
            'pace' => ['sometimes', 'string', 'in:slow,medium,fast'],
            'max_budget' => ['sometimes', 'numeric', 'min:0'],
            'visited_cities' => ['sometimes', 'array'],
        ];
    }

}

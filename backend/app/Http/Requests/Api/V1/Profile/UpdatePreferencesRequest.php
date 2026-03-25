<?php

namespace App\Http\Requests\Api\V1\Profile;

use App\Http\Requests\Api\V1\BaseApiRequest;

class UpdatePreferencesRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'environments' => ['sometimes', 'array'],
            'environments.*' => ['string'],
            'traveler_profile' => ['sometimes', 'nullable', 'string'],
            'diet' => ['sometimes', 'array'],
            'diet.*' => ['string'],
            'breakfast_included' => ['sometimes', 'boolean'],
            'interests' => ['sometimes', 'array'],
            'interests.*' => ['string'],
            'pace' => ['sometimes', 'nullable', 'string', 'in:slow,medium,fast,planifie,spontane,flexible'],
            'food_preference' => ['sometimes', 'nullable', 'string'],
            'max_budget' => ['sometimes', 'numeric', 'min:0'],
            'visited_cities' => ['sometimes', 'array'],
            'visited_cities.*' => ['string'],
        ];
    }

}

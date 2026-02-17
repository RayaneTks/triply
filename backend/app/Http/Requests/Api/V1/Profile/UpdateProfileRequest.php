<?php

namespace App\Http\Requests\Api\V1\Profile;

use App\Http\Requests\Api\V1\BaseApiRequest;

class UpdateProfileRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:120'],
            'photo_url' => ['sometimes', 'nullable', 'url'],
            'timezone' => ['sometimes', 'string', 'max:64'],
        ];
    }
}

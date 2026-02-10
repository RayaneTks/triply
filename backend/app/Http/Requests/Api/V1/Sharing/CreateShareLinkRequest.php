<?php

namespace App\Http\Requests\Api\V1\Sharing;

use App\Http\Requests\Api\V1\BaseApiRequest;

class CreateShareLinkRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'expires_at' => ['nullable', 'date'],
            'password' => ['nullable', 'string', 'min:6'],
        ];
    }
}

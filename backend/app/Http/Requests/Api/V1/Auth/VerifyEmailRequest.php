<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Http\Requests\Api\V1\BaseApiRequest;

class VerifyEmailRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'id' => ['required', 'string'],
            'hash' => ['required', 'string'],
            'signature' => ['nullable', 'string'],
            'expires' => ['nullable', 'integer'],
        ];
    }
}

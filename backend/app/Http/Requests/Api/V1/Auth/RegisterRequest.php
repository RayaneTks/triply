<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Http\Requests\Api\V1\BaseApiRequest;

class RegisterRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }
}

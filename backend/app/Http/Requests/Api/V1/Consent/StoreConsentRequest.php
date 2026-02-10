<?php

namespace App\Http\Requests\Api\V1\Consent;

use App\Http\Requests\Api\V1\BaseApiRequest;

class StoreConsentRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'analytics' => ['required', 'boolean'],
            'marketing' => ['required', 'boolean'],
            'functional' => ['required', 'boolean'],
            'version' => ['required', 'string', 'max:20'],
        ];
    }
}

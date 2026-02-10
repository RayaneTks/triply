<?php

namespace App\Http\Requests\Api\V1\Export;

use App\Http\Requests\Api\V1\BaseApiRequest;

class ExportTripRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'locale' => ['nullable', 'string', 'max:10'],
            'timezone' => ['nullable', 'string', 'max:64'],
        ];
    }
}

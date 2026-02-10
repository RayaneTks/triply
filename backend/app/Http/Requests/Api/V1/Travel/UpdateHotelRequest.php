<?php

namespace App\Http\Requests\Api\V1\Travel;

use App\Http\Requests\Api\V1\BaseApiRequest;

class UpdateHotelRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:150'],
            'address' => ['sometimes', 'string', 'max:255'],
            'check_in' => ['sometimes', 'date'],
            'check_out' => ['sometimes', 'date'],
        ];
    }
}

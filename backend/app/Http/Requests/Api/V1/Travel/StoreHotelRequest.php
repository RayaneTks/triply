<?php

namespace App\Http\Requests\Api\V1\Travel;

use App\Http\Requests\Api\V1\BaseApiRequest;

class StoreHotelRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'address' => ['required', 'string', 'max:255'],
            'check_in' => ['nullable', 'date'],
            'check_out' => ['nullable', 'date'],
        ];
    }
}

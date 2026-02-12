<?php

namespace App\Http\Requests\Api\V1\Trips;

use App\Http\Requests\Api\V1\BaseApiRequest;

class UpdateDayRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'available_minutes' => ['sometimes', 'integer', 'min:0'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i'],
        ];
    }
}

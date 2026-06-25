<?php

namespace App\Http\Requests\Api\V1\Trips;

use App\Http\Requests\Api\V1\BaseApiRequest;

class ReshuffleBudgetRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'savings_target_eur' => ['required', 'numeric', 'min:1', 'max:100000'],
        ];
    }
}

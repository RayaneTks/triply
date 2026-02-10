<?php

namespace App\Http\Requests\Api\V1\Booking;

use App\Http\Requests\Api\V1\BaseApiRequest;

class CheckoutBookingRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'provider' => ['required', 'string', 'max:100'],
            'currency' => ['required', 'string', 'size:3'],
            'amount' => ['required', 'numeric', 'min:0'],
            'items' => ['nullable', 'array'],
        ];
    }
}

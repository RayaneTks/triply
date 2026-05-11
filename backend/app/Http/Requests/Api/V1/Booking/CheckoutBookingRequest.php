<?php

namespace App\Http\Requests\Api\V1\Booking;

use App\Http\Requests\Api\V1\BaseApiRequest;

class CheckoutBookingRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'provider' => ['required', 'string', 'max:100'],
            'kind' => ['nullable', 'string', 'in:flight,hotel,activity,bundle'],
            'currency' => ['nullable', 'string', 'size:3'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'items' => ['nullable', 'array'],
            'destination' => ['nullable', 'string', 'max:191'],
            'check_in' => ['nullable', 'date'],
            'check_out' => ['nullable', 'date'],
            'adults' => ['nullable', 'integer', 'min:1', 'max:20'],
            'origin' => ['nullable', 'string', 'max:10'],
            'destination_code' => ['nullable', 'string', 'max:10'],
        ];
    }
}

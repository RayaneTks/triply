<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

abstract class BaseApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
}

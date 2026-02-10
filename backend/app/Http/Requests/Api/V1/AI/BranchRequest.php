<?php

namespace App\Http\Requests\Api\V1\AI;

use App\Http\Requests\Api\V1\BaseApiRequest;

class BranchRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'conversation_id' => ['required', 'string'],
            'message_id' => ['required', 'string'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}

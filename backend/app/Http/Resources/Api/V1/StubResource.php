<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StubResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource['id'] ?? null,
            'type' => $this->resource['type'] ?? null,
            'attributes' => $this->resource['attributes'] ?? [],
            'todo' => $this->resource['todo'] ?? 'Implement persistence layer',
        ];
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\ObservabilityServiceInterface;

class HealthController extends ApiController
{
    public function __construct(private readonly ObservabilityServiceInterface $observabilityService)
    {
    }

    public function show()
    {
        return $this->successResponse(new StubResource($this->observabilityService->health()));
    }
}

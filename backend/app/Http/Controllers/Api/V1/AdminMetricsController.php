<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\ObservabilityServiceInterface;

class AdminMetricsController extends ApiController
{
    public function __construct(private readonly ObservabilityServiceInterface $observabilityService)
    {
    }

    public function index()
    {
        return $this->successResponse(new StubResource([
            'id' => 'admin-metrics',
            'type' => 'admin_metrics',
            'attributes' => $this->observabilityService->metrics(),
            'todo' => null,
        ]));
    }
}

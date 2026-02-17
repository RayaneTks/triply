<?php

namespace App\Services\Stubs;

use App\Services\Contracts\ObservabilityServiceInterface;

class ObservabilityServiceStub implements ObservabilityServiceInterface
{
    public function health(): array
    {
        return ['id' => 'health_stub', 'type' => 'health', 'attributes' => ['status' => 'ok', 'app' => config('app.name', 'Triply API'), 'env' => config('app.env')], 'todo' => 'Add deep checks (db, queue, cache, providers)'];
    }

    public function metrics(): array
    {
        return ['id' => 'metrics_stub', 'type' => 'metrics', 'attributes' => ['requests_per_minute' => null, 'llm_quota_usage' => null], 'todo' => 'Expose protected metrics source'];
    }
}

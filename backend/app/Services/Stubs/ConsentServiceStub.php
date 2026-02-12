<?php

namespace App\Services\Stubs;

use App\Services\Contracts\ConsentServiceInterface;

class ConsentServiceStub implements ConsentServiceInterface
{
    public function getConsent(): array
    {
        return ['id' => 'consent_stub_001', 'type' => 'consent', 'attributes' => ['analytics' => false, 'marketing' => false, 'functional' => true], 'todo' => 'Load consent by user or anonymous session'];
    }

    public function saveConsent(array $payload): array
    {
        return ['id' => 'consent_stub_001', 'type' => 'consent', 'attributes' => $payload, 'todo' => 'Persist consent'];
    }
}

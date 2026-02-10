<?php

namespace App\Services\Contracts;

interface ObservabilityServiceInterface
{
    public function health(): array;
    public function metrics(): array;
}

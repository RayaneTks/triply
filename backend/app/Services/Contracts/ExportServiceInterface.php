<?php

namespace App\Services\Contracts;

interface ExportServiceInterface
{
    public function exportPdf(string $tripId, array $payload): array;
    public function exportIcs(string $tripId, array $payload): array;
}

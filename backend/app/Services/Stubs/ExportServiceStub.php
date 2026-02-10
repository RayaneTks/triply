<?php

namespace App\Services\Stubs;

use App\Services\Contracts\ExportServiceInterface;

class ExportServiceStub implements ExportServiceInterface
{
    public function exportPdf(string $tripId, array $payload): array
    {
        return ['id' => 'export_pdf_stub_001', 'type' => 'export_pdf', 'attributes' => ['trip_id' => $tripId] + $payload, 'todo' => 'Generate PDF export job'];
    }

    public function exportIcs(string $tripId, array $payload): array
    {
        return ['id' => 'export_ics_stub_001', 'type' => 'export_ics', 'attributes' => ['trip_id' => $tripId] + $payload, 'todo' => 'Generate ICS export job'];
    }
}

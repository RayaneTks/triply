<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Export\ExportTripRequest;
use App\Services\Contracts\ExportServiceInterface;
use Illuminate\Http\Response;

class TripExportController extends ApiController
{
    public function __construct(private readonly ExportServiceInterface $exportService)
    {
    }

    public function exportPdf(ExportTripRequest $request, string $trip): Response
    {
        return $this->fileResponse($this->exportService->exportPdf($trip, $request->validated()));
    }

    public function exportIcs(ExportTripRequest $request, string $trip): Response
    {
        return $this->fileResponse($this->exportService->exportIcs($trip, $request->validated()));
    }

    /**
     * @param  array{content: string, filename: string, mime: string}  $file
     */
    private function fileResponse(array $file): Response
    {
        return response($file['content'], 200, [
            'Content-Type' => $file['mime'],
            'Content-Disposition' => 'attachment; filename="'.$file['filename'].'"',
        ]);
    }
}

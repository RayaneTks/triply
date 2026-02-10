<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Export\ExportTripRequest;
use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\ExportServiceInterface;

class TripExportController extends ApiController
{
    public function __construct(private readonly ExportServiceInterface $exportService)
    {
    }

    public function exportPdf(ExportTripRequest $request, string $trip)
    {
        return $this->successResponse(new StubResource($this->exportService->exportPdf($trip, $request->validated())), status: 202);
    }

    public function exportIcs(ExportTripRequest $request, string $trip)
    {
        return $this->successResponse(new StubResource($this->exportService->exportIcs($trip, $request->validated())), status: 202);
    }
}

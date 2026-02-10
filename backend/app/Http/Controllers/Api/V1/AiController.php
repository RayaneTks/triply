<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\AI\BranchRequest;
use App\Http\Requests\Api\V1\AI\GenerateActivityRequest;
use App\Http\Requests\Api\V1\AI\GenerateDayRequest;
use App\Http\Requests\Api\V1\AI\PlanRequest;
use App\Http\Requests\Api\V1\AI\QaRequest;
use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\AiServiceInterface;

class AiController extends ApiController
{
    public function __construct(private readonly AiServiceInterface $aiService)
    {
    }

    public function plan(PlanRequest $request)
    {
        return $this->successResponse(new StubResource($this->aiService->plan($request->validated())), status: 202);
    }

    public function generateDay(GenerateDayRequest $request, string $trip, string $day)
    {
        return $this->successResponse(new StubResource($this->aiService->generateDay($trip, $day, $request->validated())), status: 202);
    }

    public function generateActivity(GenerateActivityRequest $request, string $activity)
    {
        return $this->successResponse(new StubResource($this->aiService->generateActivity($activity, $request->validated())), status: 202);
    }

    public function jobStatus(string $jobId)
    {
        return $this->successResponse(new StubResource($this->aiService->jobStatus($jobId)));
    }

    public function cancelJob(string $jobId)
    {
        return $this->successResponse(new StubResource($this->aiService->cancelJob($jobId)));
    }

    public function qa(QaRequest $request)
    {
        return $this->successResponse(new StubResource($this->aiService->qa($request->validated())));
    }

    public function branch(BranchRequest $request)
    {
        return $this->successResponse(new StubResource($this->aiService->branch($request->validated())));
    }
}

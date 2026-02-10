<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Consent\StoreConsentRequest;
use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\ConsentServiceInterface;

class ConsentController extends ApiController
{
    public function __construct(private readonly ConsentServiceInterface $consentService)
    {
    }

    public function show()
    {
        return $this->successResponse(new StubResource($this->consentService->getConsent()));
    }

    public function store(StoreConsentRequest $request)
    {
        return $this->successResponse(new StubResource($this->consentService->saveConsent($request->validated())));
    }
}

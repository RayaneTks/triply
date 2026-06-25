<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Consent\StoreConsentRequest;
use App\Services\Contracts\ConsentServiceInterface;

class ConsentController extends ApiController
{
    public function __construct(private readonly ConsentServiceInterface $consentService)
    {
    }

    public function show()
    {
        return $this->successResponse($this->consentService->getConsent());
    }

    public function store(StoreConsentRequest $request)
    {
        return $this->successResponse($this->consentService->saveConsent($request->validated()));
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Profile\UpdatePreferencesRequest;
use App\Http\Requests\Api\V1\Profile\UpdateProfileRequest;
use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\ProfileServiceInterface;

class ProfileController extends ApiController
{
    public function __construct(private readonly ProfileServiceInterface $profileService)
    {
    }

    public function show()
    {
        return $this->successResponse(new StubResource($this->profileService->show()));
    }

    public function update(UpdateProfileRequest $request)
    {
        return $this->successResponse(new StubResource($this->profileService->updateProfile($request->validated())));
    }

    public function updatePreferences(UpdatePreferencesRequest $request)
    {
        return $this->successResponse(new StubResource($this->profileService->updatePreferences($request->validated())));
    }
}

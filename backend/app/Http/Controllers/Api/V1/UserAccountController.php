<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\User\DeleteUserRequest;
use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\ProfileServiceInterface;

class UserAccountController extends ApiController
{
    public function __construct(private readonly ProfileServiceInterface $profileService)
    {
    }

    public function export()
    {
        return $this->successResponse(new StubResource($this->profileService->exportUserData()), status: 202);
    }

    public function destroy(DeleteUserRequest $request)
    {
        return $this->successResponse(new StubResource($this->profileService->deleteUser($request->validated())));
    }
}

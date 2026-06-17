<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\User\DeleteUserRequest;
use App\Services\Contracts\ProfileServiceInterface;

class UserAccountController extends ApiController
{
    public function __construct(private readonly ProfileServiceInterface $profileService)
    {
    }

    public function export()
    {
        return $this->successResponse($this->profileService->exportUserData());
    }

    public function destroy(DeleteUserRequest $request)
    {
        $payload = $request->validated();

        if (! (bool) ($payload['confirm'] ?? false)) {
            return $this->errorResponse(
                'CONFIRMATION_REQUIRED',
                'La suppression du compte doit etre confirmee.',
                ['confirm' => ['La confirmation est obligatoire.']],
                422
            );
        }

        return $this->successResponse($this->profileService->deleteUser($payload));
    }
}

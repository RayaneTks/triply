<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Sharing\CreateShareLinkRequest;
use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\SharingServiceInterface;
use Illuminate\Http\Request;

class TripSharingController extends ApiController
{
    public function __construct(private readonly SharingServiceInterface $sharingService)
    {
    }

    public function create(CreateShareLinkRequest $request, string $trip)
    {
        return $this->successResponse(new StubResource($this->sharingService->createShareLink($trip, $request->validated())), status: 201);
    }

    public function showPublic(Request $request, string $token)
    {
        $password = $request->query('password');
        if (! is_string($password) || $password === '') {
            $headerPassword = $request->header('X-Share-Password');
            $password = is_string($headerPassword) && $headerPassword !== '' ? $headerPassword : null;
        }

        $result = $this->sharingService->publicRecap($token, $password);

        if (is_array($result) && isset($result['error_code'])) {
            $status = isset($result['_httpStatus']) && is_int($result['_httpStatus']) ? $result['_httpStatus'] : 401;
            return $this->errorResponse(
                (string) $result['error_code'],
                (string) ($result['error_message'] ?? 'Acces refuse.'),
                [],
                $status
            );
        }

        return $this->successResponse(new StubResource($result));
    }
}

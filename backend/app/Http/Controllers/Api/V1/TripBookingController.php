<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Booking\CheckoutBookingRequest;
use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\BookingServiceInterface;

class TripBookingController extends ApiController
{
    public function __construct(private readonly BookingServiceInterface $bookingService)
    {
    }

    public function checkout(CheckoutBookingRequest $request, string $trip)
    {
        return $this->successResponse(new StubResource($this->bookingService->checkout($trip, $request->validated())), status: 202);
    }
}

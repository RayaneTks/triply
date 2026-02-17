<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Travel\StoreFlightRequest;
use App\Http\Requests\Api\V1\Travel\StoreHotelRequest;
use App\Http\Requests\Api\V1\Travel\StoreLocalTransportRequest;
use App\Http\Requests\Api\V1\Travel\UpdateFlightRequest;
use App\Http\Requests\Api\V1\Travel\UpdateHotelRequest;
use App\Http\Requests\Api\V1\Travel\UpdateLocalTransportRequest;
use App\Http\Resources\Api\V1\StubResource;
use App\Services\Contracts\TravelServiceInterface;

class TripTravelController extends ApiController
{
    public function __construct(private readonly TravelServiceInterface $travelService)
    {
    }

    public function listFlights(string $trip)
    {
        return $this->successResponse($this->travelService->listFlights($trip));
    }

    public function storeFlight(StoreFlightRequest $request, string $trip)
    {
        return $this->successResponse(new StubResource($this->travelService->createFlight($trip, $request->validated())), status: 201);
    }

    public function updateFlight(UpdateFlightRequest $request, string $trip, string $flight)
    {
        return $this->successResponse(new StubResource($this->travelService->updateFlight($trip, $flight, $request->validated())));
    }

    public function deleteFlight(string $trip, string $flight)
    {
        return $this->successResponse(new StubResource($this->travelService->deleteFlight($trip, $flight)));
    }

    public function listHotels(string $trip)
    {
        return $this->successResponse($this->travelService->listHotels($trip));
    }

    public function storeHotel(StoreHotelRequest $request, string $trip)
    {
        return $this->successResponse(new StubResource($this->travelService->createHotel($trip, $request->validated())), status: 201);
    }

    public function updateHotel(UpdateHotelRequest $request, string $trip, string $hotel)
    {
        return $this->successResponse(new StubResource($this->travelService->updateHotel($trip, $hotel, $request->validated())));
    }

    public function deleteHotel(string $trip, string $hotel)
    {
        return $this->successResponse(new StubResource($this->travelService->deleteHotel($trip, $hotel)));
    }

    public function listLocalTransports(string $trip)
    {
        return $this->successResponse($this->travelService->listLocalTransports($trip));
    }

    public function storeLocalTransport(StoreLocalTransportRequest $request, string $trip)
    {
        return $this->successResponse(new StubResource($this->travelService->createLocalTransport($trip, $request->validated())), status: 201);
    }

    public function updateLocalTransport(UpdateLocalTransportRequest $request, string $trip, string $localTransport)
    {
        return $this->successResponse(new StubResource($this->travelService->updateLocalTransport($trip, $localTransport, $request->validated())));
    }

    public function deleteLocalTransport(string $trip, string $localTransport)
    {
        return $this->successResponse(new StubResource($this->travelService->deleteLocalTransport($trip, $localTransport)));
    }
}

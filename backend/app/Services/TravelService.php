<?php

namespace App\Services;

use App\Models\LocalTransport;
use App\Models\Voyage;
use App\Services\Contracts\TravelServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;

class TravelService implements TravelServiceInterface
{
    public function listFlights(string $tripId): array
    {
        $voyage = $this->findUserTrip($tripId);

        return [
            'trip_id' => $tripId,
            'items' => $voyage->transports->map(fn ($t) => [
                'id' => (string) $t->id,
                'type' => $t->type,
                'depart_lieu' => $t->depart_lieu,
                'arrivee_lieu' => $t->arrivee_lieu,
                'depart_le' => $t->depart_le?->toIso8601String(),
                'arrivee_le' => $t->arrivee_le?->toIso8601String(),
                'prix' => $t->prix,
                'devise' => $t->devise,
                'information_supplementaire' => $t->information_supplementaire,
            ])->values()->all(),
        ];
    }

    public function createFlight(string $tripId, array $payload): array
    {
        return ['id' => 'flight_stub_001', 'type' => 'flight', 'attributes' => $payload + ['trip_id' => $tripId]];
    }

    public function updateFlight(string $tripId, string $flightId, array $payload): array
    {
        return ['id' => $flightId, 'type' => 'flight', 'attributes' => $payload + ['trip_id' => $tripId]];
    }

    public function deleteFlight(string $tripId, string $flightId): array
    {
        return ['id' => $flightId, 'type' => 'flight_deletion', 'attributes' => ['trip_id' => $tripId, 'deleted' => true]];
    }

    public function listHotels(string $tripId): array
    {
        $voyage = $this->findUserTrip($tripId);

        return [
            'trip_id' => $tripId,
            'items' => $voyage->hebergements->map(fn ($h) => [
                'id' => (string) $h->id,
                'nom' => $h->nom,
                'adresse' => $h->adresse,
                'ville' => $h->ville,
                'arrivee_le' => $h->arrivee_le?->toIso8601String(),
                'depart_le' => $h->depart_le?->toIso8601String(),
                'prix' => $h->prix,
                'devise' => $h->devise,
            ])->values()->all(),
        ];
    }

    public function createHotel(string $tripId, array $payload): array
    {
        return ['id' => 'hotel_stub_001', 'type' => 'hotel', 'attributes' => $payload + ['trip_id' => $tripId]];
    }

    public function updateHotel(string $tripId, string $hotelId, array $payload): array
    {
        return ['id' => $hotelId, 'type' => 'hotel', 'attributes' => $payload + ['trip_id' => $tripId]];
    }

    public function deleteHotel(string $tripId, string $hotelId): array
    {
        return ['id' => $hotelId, 'type' => 'hotel_deletion', 'attributes' => ['trip_id' => $tripId, 'deleted' => true]];
    }

    public function listLocalTransports(string $tripId): array
    {
        $voyage = $this->findUserTrip($tripId);

        $items = LocalTransport::query()
            ->where('voyage_id', $voyage->id)
            ->orderBy('departure_at')
            ->get()
            ->map(fn (LocalTransport $lt) => $this->serializeLocalTransport($lt))
            ->values()
            ->all();

        return ['trip_id' => $tripId, 'items' => $items];
    }

    public function createLocalTransport(string $tripId, array $payload): array
    {
        $voyage = $this->findUserTrip($tripId);

        $lt = LocalTransport::query()->create([
            'voyage_id' => $voyage->id,
            'type' => $payload['type'],
            'from_label' => $payload['from'],
            'to_label' => $payload['to'],
            'departure_at' => $payload['departure_at'] ?? null,
            'arrival_at' => $payload['arrival_at'] ?? null,
            'price' => $payload['price'] ?? null,
            'currency' => $payload['currency'] ?? null,
            'notes' => $payload['notes'] ?? null,
        ]);

        return $this->serializeLocalTransport($lt);
    }

    public function updateLocalTransport(string $tripId, string $transportId, array $payload): array
    {
        $voyage = $this->findUserTrip($tripId);
        $lt = LocalTransport::query()->where('voyage_id', $voyage->id)->whereKey($transportId)->firstOrFail();

        $update = [];
        foreach (['type', 'departure_at', 'arrival_at', 'price', 'currency', 'notes'] as $field) {
            if (array_key_exists($field, $payload)) {
                $update[$field] = $payload[$field];
            }
        }
        if (array_key_exists('from', $payload)) {
            $update['from_label'] = $payload['from'];
        }
        if (array_key_exists('to', $payload)) {
            $update['to_label'] = $payload['to'];
        }
        if ($update !== []) {
            $lt->update($update);
        }

        return $this->serializeLocalTransport($lt->fresh());
    }

    public function deleteLocalTransport(string $tripId, string $transportId): array
    {
        $voyage = $this->findUserTrip($tripId);
        $lt = LocalTransport::query()->where('voyage_id', $voyage->id)->whereKey($transportId)->firstOrFail();
        $lt->delete();

        return [
            'id' => $transportId,
            'type' => 'local_transport_deletion',
            'attributes' => ['trip_id' => $tripId, 'deleted' => true],
        ];
    }

    private function findUserTrip(string $tripId): Voyage
    {
        $user = Auth::user();
        if (! $user) {
            throw new ModelNotFoundException('Utilisateur non authentifie.');
        }

        return Voyage::query()
            ->where('id', $tripId)
            ->where('user_id', $user->id)
            ->with(['transports', 'hebergements'])
            ->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeLocalTransport(LocalTransport $lt): array
    {
        return [
            'id' => (string) $lt->id,
            'type' => 'local_transport',
            'attributes' => [
                'trip_id' => (string) $lt->voyage_id,
                'mode' => $lt->type,
                'from' => $lt->from_label,
                'to' => $lt->to_label,
                'departure_at' => $lt->departure_at?->toIso8601String(),
                'arrival_at' => $lt->arrival_at?->toIso8601String(),
                'price' => $lt->price !== null ? (float) $lt->price : null,
                'currency' => $lt->currency,
                'notes' => $lt->notes,
            ],
        ];
    }
}

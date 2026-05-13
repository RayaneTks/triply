<?php

namespace App\Services;

use App\Models\Hebergement;
use App\Models\LocalTransport;
use App\Models\Transport;
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
            'items' => $voyage->transports
                ->map(fn (Transport $t) => $this->serializeFlight($t))
                ->values()
                ->all(),
        ];
    }

    public function createFlight(string $tripId, array $payload): array
    {
        $voyage = $this->findUserTrip($tripId);

        $transport = Transport::query()->create([
            'voyage_id' => $voyage->id,
            'type' => $payload['type'],
            'depart_lieu' => $payload['depart_lieu'],
            'arrivee_lieu' => $payload['arrivee_lieu'],
            'depart_le' => $payload['depart_le'],
            'arrivee_le' => $payload['arrivee_le'],
            'prix' => $payload['prix'],
            'devise' => $payload['devise'] ?? 'EUR',
            'information_supplementaire' => $payload['information_supplementaire'] ?? null,
        ]);

        return $this->serializeFlight($transport);
    }

    public function updateFlight(string $tripId, string $flightId, array $payload): array
    {
        $voyage = $this->findUserTrip($tripId);
        $transport = Transport::query()
            ->where('voyage_id', $voyage->id)
            ->whereKey($flightId)
            ->firstOrFail();

        $update = [];
        foreach (['type', 'depart_lieu', 'arrivee_lieu', 'depart_le', 'arrivee_le', 'prix', 'devise', 'information_supplementaire'] as $field) {
            if (array_key_exists($field, $payload)) {
                $update[$field] = $payload[$field];
            }
        }
        if ($update !== []) {
            $transport->update($update);
        }

        return $this->serializeFlight($transport->fresh());
    }

    public function deleteFlight(string $tripId, string $flightId): array
    {
        $voyage = $this->findUserTrip($tripId);
        $transport = Transport::query()
            ->where('voyage_id', $voyage->id)
            ->whereKey($flightId)
            ->firstOrFail();
        $transport->delete();

        return [
            'id' => $flightId,
            'type' => 'flight_deletion',
            'attributes' => ['trip_id' => $tripId, 'deleted' => true],
        ];
    }

    public function listHotels(string $tripId): array
    {
        $voyage = $this->findUserTrip($tripId);

        return [
            'trip_id' => $tripId,
            'items' => $voyage->hebergements
                ->map(fn (Hebergement $h) => $this->serializeHotel($h))
                ->values()
                ->all(),
        ];
    }

    public function createHotel(string $tripId, array $payload): array
    {
        $voyage = $this->findUserTrip($tripId);

        $hebergement = Hebergement::query()->create([
            'voyage_id' => $voyage->id,
            'type' => $payload['type'],
            'nom' => $payload['nom'],
            'adresse' => $payload['adresse'],
            'code_postal' => $payload['code_postal'] ?? null,
            'ville' => $payload['ville'] ?? null,
            'latitude' => $payload['latitude'] ?? null,
            'longitude' => $payload['longitude'] ?? null,
            'arrivee_le' => $payload['arrivee_le'],
            'depart_le' => $payload['depart_le'],
            'prix' => $payload['prix'],
            'devise' => $payload['devise'] ?? 'EUR',
            'informations_supplementaire' => $payload['informations_supplementaire'] ?? null,
        ]);

        return $this->serializeHotel($hebergement);
    }

    public function updateHotel(string $tripId, string $hotelId, array $payload): array
    {
        $voyage = $this->findUserTrip($tripId);
        $hebergement = Hebergement::query()
            ->where('voyage_id', $voyage->id)
            ->whereKey($hotelId)
            ->firstOrFail();

        $update = [];
        foreach (['type', 'nom', 'adresse', 'code_postal', 'ville', 'latitude', 'longitude', 'arrivee_le', 'depart_le', 'prix', 'devise', 'informations_supplementaire'] as $field) {
            if (array_key_exists($field, $payload)) {
                $update[$field] = $payload[$field];
            }
        }
        if ($update !== []) {
            $hebergement->update($update);
        }

        return $this->serializeHotel($hebergement->fresh());
    }

    public function deleteHotel(string $tripId, string $hotelId): array
    {
        $voyage = $this->findUserTrip($tripId);
        $hebergement = Hebergement::query()
            ->where('voyage_id', $voyage->id)
            ->whereKey($hotelId)
            ->firstOrFail();
        $hebergement->delete();

        return [
            'id' => $hotelId,
            'type' => 'hotel_deletion',
            'attributes' => ['trip_id' => $tripId, 'deleted' => true],
        ];
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
    private function serializeFlight(Transport $t): array
    {
        return [
            'id' => (string) $t->id,
            'type' => $t->type,
            'depart_lieu' => $t->depart_lieu,
            'arrivee_lieu' => $t->arrivee_lieu,
            'depart_le' => $t->depart_le?->toIso8601String(),
            'arrivee_le' => $t->arrivee_le?->toIso8601String(),
            'prix' => $t->prix,
            'devise' => $t->devise,
            'information_supplementaire' => $t->information_supplementaire,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeHotel(Hebergement $h): array
    {
        return [
            'id' => (string) $h->id,
            'type' => $h->type,
            'nom' => $h->nom,
            'adresse' => $h->adresse,
            'code_postal' => $h->code_postal,
            'ville' => $h->ville,
            'latitude' => $h->latitude,
            'longitude' => $h->longitude,
            'arrivee_le' => $h->arrivee_le?->toIso8601String(),
            'depart_le' => $h->depart_le?->toIso8601String(),
            'prix' => $h->prix,
            'devise' => $h->devise,
            'informations_supplementaire' => $h->informations_supplementaire,
        ];
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

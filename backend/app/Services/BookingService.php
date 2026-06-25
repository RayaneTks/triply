<?php

namespace App\Services;

use App\Models\Voyage;
use App\Services\Contracts\BookingServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class BookingService implements BookingServiceInterface
{
    /**
     * Construit un deeplink affilie (Booking.com, Skyscanner, GetYourGuide) selon le provider/type
     * et retourne une intention de checkout.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function checkout(string $tripId, array $payload): array
    {
        $voyage = $this->findUserTrip($tripId);

        $provider = strtolower((string) ($payload['provider'] ?? 'booking'));
        $kind = strtolower((string) ($payload['kind'] ?? 'hotel'));
        $destination = trim((string) ($payload['destination'] ?? $voyage->destination ?? ''));
        $checkIn = isset($payload['check_in']) ? Carbon::parse((string) $payload['check_in'])->toDateString() : optional($voyage->date_debut)->toDateString();
        $checkOut = isset($payload['check_out']) ? Carbon::parse((string) $payload['check_out'])->toDateString() : optional($voyage->date_fin)->toDateString();
        $adults = isset($payload['adults']) && is_numeric($payload['adults'])
            ? max(1, min(20, (int) $payload['adults']))
            : max(1, (int) ($voyage->nb_voyageurs ?? 1));

        $aid = (string) config('integrations.booking.affiliate_id', '');
        $skyscannerSubId = (string) config('integrations.skyscanner.sub_id', '');

        $deeplink = $this->buildDeeplink(
            provider: $provider,
            kind: $kind,
            destination: $destination,
            checkIn: $checkIn,
            checkOut: $checkOut,
            adults: $adults,
            origin: (string) ($payload['origin'] ?? ''),
            destinationCode: (string) ($payload['destination_code'] ?? ''),
            affiliateId: $aid !== '' ? $aid : null,
            skyscannerSubId: $skyscannerSubId !== '' ? $skyscannerSubId : null,
            propertyName: (string) ($payload['property_name'] ?? ''),
            address: (string) ($payload['address'] ?? ''),
            latitude: isset($payload['latitude']) && is_numeric($payload['latitude']) ? (float) $payload['latitude'] : null,
            longitude: isset($payload['longitude']) && is_numeric($payload['longitude']) ? (float) $payload['longitude'] : null,
        );

        return [
            'id' => 'co_'.substr(bin2hex(random_bytes(8)), 0, 16),
            'type' => 'booking_checkout',
            'attributes' => [
                'trip_id' => (string) $voyage->id,
                'provider' => $provider,
                'kind' => $kind,
                'deeplink' => $deeplink,
                'destination' => $destination,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'adults' => $adults,
                'currency' => $payload['currency'] ?? 'EUR',
                'amount' => $payload['amount'] ?? null,
            ],
        ];
    }

    private function buildDeeplink(
        string $provider,
        string $kind,
        string $destination,
        ?string $checkIn,
        ?string $checkOut,
        int $adults,
        string $origin,
        string $destinationCode,
        ?string $affiliateId,
        ?string $skyscannerSubId,
        string $propertyName = '',
        string $address = '',
        ?float $latitude = null,
        ?float $longitude = null,
    ): string {
        switch ($provider) {
            case 'skyscanner':
                $origin = $origin !== '' ? strtoupper($origin) : 'PAR';
                $dest = $destinationCode !== '' ? strtoupper($destinationCode) : 'ANY';
                $date = $checkIn !== null ? str_replace('-', '', substr($checkIn, 2, 8)) : '';
                $url = sprintf('https://www.skyscanner.net/transport/flights/%s/%s/%s/', strtolower($origin), strtolower($dest), $date);
                if ($skyscannerSubId !== null) {
                    $url .= '?associateid='.rawurlencode($skyscannerSubId);
                }

                return $url;

            case 'getyourguide':
                $base = 'https://www.getyourguide.com/s/';
                $url = $base.'?'.http_build_query(array_filter([
                    'q' => $destination,
                    'date_from' => $checkIn,
                    'date_to' => $checkOut,
                    'partner_id' => $affiliateId,
                ]));

                return $url;

            case 'booking':
            default:
                $searchQuery = $this->buildHotelSearchQuery($propertyName, $destination, $address);
                $url = 'https://www.booking.com/searchresults.html?'.http_build_query(array_filter([
                    'ss' => $searchQuery,
                    'checkin' => $checkIn,
                    'checkout' => $checkOut,
                    'group_adults' => $adults,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'aid' => $affiliateId,
                    'label' => 'triply-recap',
                ], fn ($value) => $value !== null && $value !== ''));

                return $url;
        }
    }

    /**
     * Construit une requête de recherche ciblant un hôtel précis plutôt que la ville seule.
     */
    private function buildHotelSearchQuery(string $propertyName, string $destination, string $address): string
    {
        $name = trim($propertyName);
        $city = trim($destination);
        $addr = trim($address);

        if ($name !== '') {
            $parts = [$name];
            if ($addr !== '' && ! str_contains(mb_strtolower($name), mb_strtolower($addr))) {
                $parts[] = $addr;
            } elseif ($city !== '' && ! str_contains(mb_strtolower($name), mb_strtolower($city))) {
                $parts[] = $city;
            }

            return implode(', ', $parts);
        }

        if ($addr !== '') {
            return $city !== '' ? "{$addr}, {$city}" : $addr;
        }

        return $city;
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
            ->firstOrFail();
    }
}

<?php

namespace App\Services;

use App\Models\Abonnement;
use App\Models\LocalTransport;
use App\Models\Journee;
use App\Models\User;
use App\Models\Voyage;
use App\Services\Contracts\ProfileServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProfileService implements ProfileServiceInterface
{
    public function show(): array
    {
        $user = Auth::user();

        return [
            'id' => $user->id,
            'type' => 'profile',
            'attributes' => [
                'name' => $user->name,
                'email' => $user->email,
                'photo_url' => $user->photo_url,
                'timezone' => $user->timezone,
                'preferences' => $user->preferences->toArray(),
            ],
        ];
    }

    public function updateProfile(array $payload): array
    {
        $user = Auth::user();
        $user->update($payload);

        return $this->show();
    }

    public function updatePreferences(array $payload): array
    {
        $user = Auth::user();
        $user->preferences = $user->preferences->merge($payload);
        $user->save();

        return $this->show();
    }

    /**
     * Archive RGPD : assemble l'ensemble des données personnelles de
     * l'utilisateur authentifié (profil, voyages, activités, réservations
     * voyage, abonnements + paiements) dans une structure JSON portable.
     *
     * @return array<string, mixed>
     */
    public function exportUserData(): array
    {
        $user = $this->requireUser();

        $voyages = Voyage::query()
            ->where('user_id', $user->id)
            ->with(['journees.etapes', 'transports', 'hebergements'])
            ->orderBy('date_debut')
            ->get();

        $voyageIds = $voyages->pluck('id')->all();

        $localTransports = $voyageIds === []
            ? collect()
            : LocalTransport::query()->whereIn('voyage_id', $voyageIds)->get();

        $abonnements = Abonnement::query()
            ->where('utilisateur_id', $user->id)
            ->with('paiements')
            ->get();

        $trips = $voyages->map(fn (Voyage $voyage) => [
            'id' => (string) $voyage->id,
            'title' => $voyage->titre,
            'destination' => $voyage->destination,
            'start_date' => $voyage->date_debut?->toDateString(),
            'end_date' => $voyage->date_fin?->toDateString(),
            'budget_total' => $voyage->budget_total,
            'travelers_count' => $voyage->nb_voyageurs,
            'description' => $voyage->description,
            'days' => $voyage->journees->sortBy('numero_jour')->map(fn (Journee $journee) => [
                'index' => $journee->numero_jour,
                'date' => $journee->date_jour?->toDateString(),
                'activities' => $journee->etapes->sortBy('ordre')->map(fn ($etape) => [
                    'title' => $etape->titre,
                    'city' => $etape->ville,
                    'country' => $etape->pays,
                    'duration' => $etape->temps_estime,
                    'price' => $etape->prix_estime,
                    'liked_state' => $etape->liked_state,
                ])->values()->all(),
            ])->values()->all(),
            'created_at' => $voyage->created_at?->toISOString(),
        ])->values()->all();

        $activities = $voyages->flatMap(
            fn (Voyage $voyage) => $voyage->journees->flatMap(
                fn (Journee $journee) => $journee->etapes->map(fn ($etape) => [
                    'trip_id' => (string) $voyage->id,
                    'day_index' => $journee->numero_jour,
                    'title' => $etape->titre,
                    'city' => $etape->ville,
                ])
            )
        )->values()->all();

        $travelBookings = [
            'flights' => $voyages->flatMap(fn (Voyage $v) => $v->transports->map(fn ($t) => [
                'trip_id' => (string) $v->id,
                'type' => $t->type,
                'from' => $t->depart_lieu,
                'to' => $t->arrivee_lieu,
                'departure_at' => $t->depart_le?->toISOString(),
                'arrival_at' => $t->arrivee_le?->toISOString(),
                'price' => $t->prix,
                'currency' => $t->devise,
            ]))->values()->all(),
            'accommodations' => $voyages->flatMap(fn (Voyage $v) => $v->hebergements->map(fn ($h) => [
                'trip_id' => (string) $v->id,
                'name' => $h->nom,
                'address' => $h->adresse,
                'city' => $h->ville,
                'check_in' => $h->arrivee_le?->toISOString(),
                'check_out' => $h->depart_le?->toISOString(),
                'price' => $h->prix,
                'currency' => $h->devise,
            ]))->values()->all(),
            'local_transports' => $localTransports->map(fn ($lt) => [
                'trip_id' => (string) $lt->voyage_id,
                'type' => $lt->type,
                'from' => $lt->from_label,
                'to' => $lt->to_label,
                'departure_at' => $lt->departure_at?->toISOString(),
                'arrival_at' => $lt->arrival_at?->toISOString(),
                'price' => $lt->price,
                'currency' => $lt->currency,
            ])->values()->all(),
        ];

        $subscriptions = $abonnements->map(fn (Abonnement $abo) => [
            'id' => (string) $abo->id,
            'tier' => $abo->tier,
            'plan_interval' => $abo->plan_interval,
            'status' => $abo->statut,
            'start_date' => $abo->date_debut?->toISOString(),
            'end_date' => $abo->date_fin?->toISOString(),
            'payments' => $abo->paiements->map(fn ($p) => [
                'amount' => $p->montant,
                'currency' => $p->devise,
                'status' => $p->statut,
                'paid_at' => $p->paye_le?->toISOString(),
                'period_start' => $p->periode_debut?->toISOString(),
                'period_end' => $p->periode_fin?->toISOString(),
            ])->values()->all(),
        ])->values()->all();

        return [
            'export_format' => 'gdpr_data_archive',
            'export_version' => '1.0',
            'generated_at' => now()->toISOString(),
            'profile' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'photo_url' => $user->photo_url,
                'timezone' => $user->timezone,
                'subscription_tier' => $user->subscription_tier,
                'preferences' => $user->preferences->toArray(),
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'created_at' => $user->created_at?->toISOString(),
            ],
            'trips' => $trips,
            'activities' => $activities,
            'bookings' => $travelBookings,
            'subscriptions' => $subscriptions,
        ];
    }

    /**
     * Suppression de compte RGPD : anonymise les données personnelles,
     * révoque les jetons, supprime en cascade les voyages et leurs données
     * structurées, puis applique le soft-delete sur le compte.
     *
     * @return array<string, mixed>
     */
    public function deleteUser(array $payload): array
    {
        $user = $this->requireUser();

        if (! (bool) ($payload['confirm'] ?? false)) {
            throw new \InvalidArgumentException('Confirmation requise pour supprimer le compte.');
        }

        DB::transaction(function () use ($user) {
            // Cascade des voyages et de leurs données structurées.
            $voyages = Voyage::query()->where('user_id', $user->id)->with('journees')->get();
            $voyageIds = $voyages->pluck('id')->all();

            foreach ($voyages as $voyage) {
                foreach ($voyage->journees as $journee) {
                    $journee->etapes()->forceDelete();
                }
                $voyage->journees()->delete();
                $voyage->hebergements()->delete();
                $voyage->transports()->delete();
            }

            if ($voyageIds !== []) {
                LocalTransport::query()->whereIn('voyage_id', $voyageIds)->delete();
            }

            Voyage::query()->where('user_id', $user->id)->delete();

            // Révocation des jetons d'accès personnels.
            $user->tokens()->delete();

            // Anonymisation des PII avant soft-delete.
            $user->forceFill([
                'name' => 'Compte supprimé',
                'email' => 'deleted-'.$user->id.'-'.Str::lower(Str::random(8)).'@deleted.triply.invalid',
                'photo_url' => null,
                'timezone' => null,
            ])->save();

            $user->delete();
        });

        return [
            'id' => (string) $user->id,
            'type' => 'user_deletion',
            'attributes' => [
                'deleted' => true,
                'anonymized' => true,
                'reason' => $payload['reason'] ?? null,
            ],
        ];
    }

    private function requireUser(): User
    {
        $user = Auth::user();
        if (! $user instanceof User) {
            throw new ModelNotFoundException('Utilisateur non authentifie.');
        }

        return $user;
    }
}

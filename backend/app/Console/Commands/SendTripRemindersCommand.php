<?php

namespace App\Console\Commands;

use App\Mail\TripReminderMail;
use App\Models\Journee;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendTripRemindersCommand extends Command
{
    protected $signature = 'triply:send-reminders
        {--dry-run : Do not dispatch notifications}
        {--kind=both : Which reminder kind to send (day_before|morning|both)}';

    protected $description = 'Dispatch reminder notifications for upcoming trip activities';

    public function handle(): int
    {
        $kind = (string) $this->option('kind');
        $dryRun = (bool) $this->option('dry-run');
        $sent = 0;

        if ($kind === 'day_before' || $kind === 'both') {
            $sent += $this->sendForDate(Carbon::tomorrow()->toDateString(), 'day_before', $dryRun);
        }
        if ($kind === 'morning' || $kind === 'both') {
            $sent += $this->sendForDate(Carbon::today()->toDateString(), 'morning', $dryRun);
        }

        $this->info(sprintf('Done. %d reminder email(s) %s.', $sent, $dryRun ? 'simulated' : 'sent'));

        return self::SUCCESS;
    }

    private function sendForDate(string $isoDate, string $kind, bool $dryRun): int
    {
        $journees = Journee::query()
            ->whereDate('date_jour', $isoDate)
            ->with(['voyage.user', 'etapes'])
            ->get();

        $count = 0;
        foreach ($journees as $journee) {
            $voyage = $journee->voyage;
            if ($voyage === null) {
                continue;
            }
            $user = $voyage->user;
            if (! $user instanceof User) {
                continue;
            }

            $preferences = $user->preferences;
            if ($preferences === null) {
                continue;
            }
            $wants = $kind === 'morning'
                ? ($preferences->reminders_morning === true)
                : ($preferences->reminders_day_before === true);
            if (! $wants) {
                continue;
            }

            $activities = $journee->etapes
                ->sortBy('ordre')
                ->map(fn ($e) => [
                    'title' => (string) $e->titre,
                    'city' => $e->ville,
                ])
                ->values()
                ->all();

            $tripUrl = rtrim((string) config('app.frontend_url'), '/').'/voyages/'.$voyage->id;
            $dateLabel = Carbon::parse($isoDate)->locale('fr')->isoFormat('dddd D MMMM');

            if ($dryRun) {
                $this->line(sprintf('[dry] %s → %s (%s)', $user->email, $voyage->titre, $kind));
            } else {
                try {
                    Mail::to($user->email)->send(new TripReminderMail(
                        name: $user->name ?? 'Voyageur',
                        tripTitle: (string) $voyage->titre,
                        kind: $kind,
                        dateLabel: $dateLabel,
                        activities: $activities,
                        tripUrl: $tripUrl,
                    ));
                } catch (Throwable $e) {
                    Log::warning('Trip reminder send failed', [
                        'email' => $user->email,
                        'trip_id' => $voyage->id,
                        'kind' => $kind,
                        'error' => $e->getMessage(),
                    ]);

                    continue;
                }
            }
            $count++;
        }

        return $count;
    }
}

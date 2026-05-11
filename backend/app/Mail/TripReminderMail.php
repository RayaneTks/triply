<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TripReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<int, array<string, mixed>>  $activities
     */
    public function __construct(
        public readonly string $name,
        public readonly string $tripTitle,
        public readonly string $kind, // 'day_before' | 'morning'
        public readonly string $dateLabel,
        public readonly array $activities,
        public readonly string $tripUrl,
    ) {
    }

    public function envelope(): Envelope
    {
        $subject = $this->kind === 'morning'
            ? sprintf('Bonjour ! Votre programme du jour à %s', $this->tripTitle)
            : sprintf('Demain, votre journée %s à %s', $this->dateLabel, $this->tripTitle);

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.trip-reminder',
            with: [
                'name' => $this->name,
                'tripTitle' => $this->tripTitle,
                'kind' => $this->kind,
                'dateLabel' => $this->dateLabel,
                'activities' => $this->activities,
                'tripUrl' => $this->tripUrl,
            ],
        );
    }
}

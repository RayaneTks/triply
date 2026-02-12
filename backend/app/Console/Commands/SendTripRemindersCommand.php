<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SendTripRemindersCommand extends Command
{
    protected $signature = 'triply:send-reminders {--dry-run : Do not dispatch notifications}';

    protected $description = 'Dispatch reminder notifications for upcoming trip activities';

    public function handle(): int
    {
        $this->info('Trip reminders stub executed.');
        $this->line('TODO: load upcoming activities and dispatch notification channels.');

        return self::SUCCESS;
    }
}

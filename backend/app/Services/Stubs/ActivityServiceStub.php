<?php

namespace App\Services\Stubs;

use App\Services\Contracts\ActivityServiceInterface;

class ActivityServiceStub implements ActivityServiceInterface
{
    public function create(string $tripId, array $payload): array
    {
        return ['id' => 'act_stub_001', 'type' => 'activity', 'attributes' => $payload + ['trip_id' => $tripId], 'todo' => 'Create activity'];
    }

    public function list(string $tripId, array $filters): array
    {
        return ['trip_id' => $tripId, 'filters' => $filters, 'items' => [['id' => 'act_stub_001', 'title' => 'Activity Stub']], 'todo' => 'Filter and paginate activities'];
    }

    public function groupedByDay(string $tripId): array
    {
        return ['trip_id' => $tripId, 'days' => [['day_id' => 'day_stub_001', 'activities' => []]], 'todo' => 'Group activities by day'];
    }

    public function show(string $tripId, string $activityId): array
    {
        return ['id' => $activityId, 'type' => 'activity', 'attributes' => ['trip_id' => $tripId], 'todo' => 'Load activity details'];
    }

    public function update(string $tripId, string $activityId, array $payload): array
    {
        return ['id' => $activityId, 'type' => 'activity', 'attributes' => $payload + ['trip_id' => $tripId], 'todo' => 'Update activity'];
    }

    public function regenerate(string $tripId, string $activityId): array
    {
        return ['id' => 'job_stub_regen_001', 'type' => 'ai_job', 'attributes' => ['trip_id' => $tripId, 'activity_id' => $activityId], 'todo' => 'Queue activity regeneration'];
    }

    public function reorder(string $tripId, array $payload): array
    {
        return ['id' => 'reorder_stub_001', 'type' => 'activity_reorder', 'attributes' => $payload + ['trip_id' => $tripId], 'todo' => 'Persist activity order'];
    }

    public function delete(string $tripId, string $activityId): array
    {
        return ['id' => $activityId, 'type' => 'activity_deletion', 'attributes' => ['trip_id' => $tripId, 'deleted' => true], 'todo' => 'Soft delete activity'];
    }

    public function restore(string $tripId, string $activityId): array
    {
        return ['id' => $activityId, 'type' => 'activity_restore', 'attributes' => ['trip_id' => $tripId, 'restored' => true], 'todo' => 'Restore soft-deleted activity'];
    }
}

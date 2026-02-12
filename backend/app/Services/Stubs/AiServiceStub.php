<?php

namespace App\Services\Stubs;

use App\Services\Contracts\AiServiceInterface;

class AiServiceStub implements AiServiceInterface
{
    public function plan(array $payload): array
    {
        return ['id' => 'job_stub_plan_001', 'type' => 'ai_job', 'attributes' => ['scope' => 'trip_plan', 'payload' => $payload], 'todo' => 'Queue full trip generation'];
    }

    public function generateDay(string $tripId, string $dayId, array $payload): array
    {
        return ['id' => 'job_stub_day_001', 'type' => 'ai_job', 'attributes' => ['trip_id' => $tripId, 'day_id' => $dayId, 'payload' => $payload], 'todo' => 'Queue day generation'];
    }

    public function generateActivity(string $activityId, array $payload): array
    {
        return ['id' => 'job_stub_activity_001', 'type' => 'ai_job', 'attributes' => ['activity_id' => $activityId, 'payload' => $payload], 'todo' => 'Queue activity generation'];
    }

    public function jobStatus(string $jobId): array
    {
        return ['id' => $jobId, 'type' => 'ai_job', 'attributes' => ['status' => 'pending', 'progress' => 0], 'todo' => 'Read async job status'];
    }

    public function cancelJob(string $jobId): array
    {
        return ['id' => $jobId, 'type' => 'ai_job', 'attributes' => ['cancelled' => true], 'todo' => 'Cancel running job'];
    }

    public function qa(array $payload): array
    {
        return ['id' => 'qa_stub_001', 'type' => 'ai_qa', 'attributes' => ['answer' => null, 'payload' => $payload], 'todo' => 'Answer contextual trip question'];
    }

    public function branch(array $payload): array
    {
        return ['id' => 'branch_stub_001', 'type' => 'ai_branch', 'attributes' => $payload, 'todo' => 'Create conversation branch from message'];
    }
}

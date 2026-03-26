<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class LineNotifyController extends ApiController
{
    /**
     * Send LINE notification.
     */
    public function send(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'token' => 'required|string',
        ]);

        $message = $request->input('message');
        $token = $request->input('token');

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$token}",
            ])->asForm()->post('https://notify-api.line.me/api/notify', [
                'message' => $message,
            ]);

            if ($response->successful()) {
                return $this->success([
                    'status' => $response->json('status'),
                    'message' => $message,
                ], 'Notification sent successfully');
            }

            return $this->error('Failed to send notification: ' . $response->body(), $response->status());
        } catch (\Exception $e) {
            return $this->error('Failed to send notification: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Send notification with image.
     */
    public function sendWithImage(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'image_url' => 'nullable|url',
            'token' => 'required|string',
        ]);

        $message = $request->input('message');
        $imageUrl = $request->input('image_url');
        $token = $request->input('token');

        try {
            $formData = [
                'message' => $message,
            ];

            if ($imageUrl) {
                $formData['imageThumbnail'] = $imageUrl;
                $formData['imageFullsize'] = $imageUrl;
            }

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$token}",
            ])->asForm()->post('https://notify-api.line.me/api/notify', $formData);

            if ($response->successful()) {
                return $this->success([
                    'status' => $response->json('status'),
                    'message' => $message,
                ], 'Notification sent successfully');
            }

            return $this->error('Failed to send notification: ' . $response->body(), $response->status());
        } catch (\Exception $e) {
            return $this->error('Failed to send notification: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Send notification about task.
     */
    public function sendTaskNotification(Request $request): JsonResponse
    {
        $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'action' => 'required|in:created,assigned,completed,overdue',
            'token' => 'required|string',
        ]);

        $task = \App\Models\Task::with(['assignments.user', 'creator'])->findOrFail($request->input('task_id'));
        $action = $request->input('action');
        $token = $request->input('token');

        $message = $this->buildTaskMessage($task, $action);

        return $this->send(new Request([
            'message' => $message,
            'token' => $token,
        ]));
    }

    /**
     * Send notification about problem report.
     */
    public function sendProblemNotification(Request $request): JsonResponse
    {
        $request->validate([
            'problem_id' => 'required|exists:problem_reports,id',
            'action' => 'required|in:reported,resolved',
            'token' => 'required|string',
        ]);

        $problem = \App\Models\ProblemReport::with(['reporter', 'farm'])->findOrFail($request->input('problem_id'));
        $action = $request->input('action');
        $token = $request->input('token');

        $message = $this->buildProblemMessage($problem, $action);

        return $this->send(new Request([
            'message' => $message,
            'token' => $token,
        ]));
    }

    /**
     * Build task notification message.
     */
    private function buildTaskMessage($task, string $action): string
    {
        $farmName = $task->farm->name;

        return match ($action) {
            'created' => "📋 [{$farmName}]\nNew task created: {$task->title}\nPriority: {$task->priority}",
            'assigned' => "📋 [{$farmName}]\nYou have been assigned: {$task->title}\nDue: {$task->due_date?->format('d/m/Y') ?? 'No due date'}",
            'completed' => "✅ [{$farmName}]\nTask completed: {$task->title}",
            'overdue' => "⚠️ [{$farmName}]\nOverdue task: {$task->title}\nWas due: {$task->due_date?->format('d/m/Y')}",
            default => "📋 [{$farmName}]\nTask update: {$task->title}",
        };
    }

    /**
     * Build problem notification message.
     */
    private function buildProblemMessage($problem, string $action): string
    {
        $farmName = $problem->farm->name;

        return match ($action) {
            'reported' => "🚨 [{$farmName}]\nNew problem reported: {$problem->title}\nSeverity: {$problem->severity}\nBy: {$problem->reporter->name}",
            'resolved' => "✅ [{$farmName}]\nProblem resolved: {$problem->title}",
            default => "🚨 [{$farmName}]\nProblem update: {$problem->title}",
        };
    }
}

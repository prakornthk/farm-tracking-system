<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\LineNotifySendRequest;
use App\Models\LineNotifyToken;
use App\Models\Task;
use App\Models\ProblemReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LineNotifyController extends ApiController
{
    /**
     * Send LINE notification using stored token for a user/farm.
     */
    public function send(LineNotifySendRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Retrieve the stored LINE Notify token for this user/farm
        $tokenRecord = LineNotifyToken::where('user_id', $user->id)->first();

        if (!$tokenRecord) {
            return $this->error('LINE Notify token not configured for this user. Please authorize first.', 400);
        }

        $message = $validated['message'];
        $token = $tokenRecord->token;

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
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
    public function sendWithImage(LineNotifySendRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $tokenRecord = LineNotifyToken::where('user_id', $user->id)->first();

        if (!$tokenRecord) {
            return $this->error('LINE Notify token not configured for this user. Please authorize first.', 400);
        }

        $message = $validated['message'];
        $imageUrl = $validated['image_url'] ?? null;
        $token = $tokenRecord->token;

        try {
            $formData = [
                'message' => $message,
            ];

            if ($imageUrl) {
                $formData['imageThumbnail'] = $imageUrl;
                $formData['imageFullsize'] = $imageUrl;
            }

            $response = \Illuminate\Support\Facades\Http::withHeaders([
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
        ]);

        $user = $request->user();
        $tokenRecord = LineNotifyToken::where('user_id', $user->id)->first();

        if (!$tokenRecord) {
            return $this->error('LINE Notify token not configured. Please authorize first.', 400);
        }

        $task = Task::with(['assignments.user', 'creator'])->findOrFail($request->input('task_id'));
        $action = $request->input('action');

        $message = $this->buildTaskMessage($task, $action);

        return $this->sendLineMessage($tokenRecord->token, $message);
    }

    /**
     * Send notification about problem report.
     */
    public function sendProblemNotification(Request $request): JsonResponse
    {
        $request->validate([
            'problem_id' => 'required|exists:problem_reports,id',
            'action' => 'required|in:reported,resolved',
        ]);

        $user = $request->user();
        $tokenRecord = LineNotifyToken::where('user_id', $user->id)->first();

        if (!$tokenRecord) {
            return $this->error('LINE Notify token not configured. Please authorize first.', 400);
        }

        $problem = ProblemReport::with(['reporter', 'farm'])->findOrFail($request->input('problem_id'));
        $action = $request->input('action');

        $message = $this->buildProblemMessage($problem, $action);

        return $this->sendLineMessage($tokenRecord->token, $message);
    }

    /**
     * Authorize LINE Notify token for a user (exchange code for token and store).
     */
    public function authorize(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $code = $request->input('code');

        // Exchange code for access token
        $tokenResponse = \Illuminate\Support\Facades\Http::asForm()->post('https://notify-api.line.me/api/token', [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'client_id' => config('services.line_notify.client_id'),
            'client_secret' => config('services.line_notify.client_secret'),
        ]);

        if (!$tokenResponse->successful()) {
            return $this->error('Failed to authorize with LINE Notify', $tokenResponse->status());
        }

        $tokenData = $tokenResponse->json();

        // Store or update the token for this user
        LineNotifyToken::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'token' => $tokenData['access_token'],
                'expires_in' => $tokenData['expires_in'] ?? null,
            ]
        );

        return $this->success(['token' => $tokenData['access_token']], 'LINE Notify authorized successfully');
    }

    /**
     * Revoke LINE Notify token for the authenticated user.
     */
    public function revoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $tokenRecord = LineNotifyToken::where('user_id', $user->id)->first();

        if (!$tokenRecord) {
            return $this->error('No LINE Notify token found', 400);
        }

        try {
            \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => "Bearer {$tokenRecord->token}",
            ])->asForm()->post('https://notify-api.line.me/api/revoke', []);
        } catch (\Exception $e) {
            // Ignore revocation errors (token might already be expired)
        }

        $tokenRecord->delete();

        return $this->success(null, 'LINE Notify token revoked successfully');
    }

    /**
     * Send LINE message helper.
     */
    private function sendLineMessage(string $token, string $message): JsonResponse
    {
        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
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

<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Farm;
use App\Models\LineNotifyToken;
use App\Models\Task;
use App\Models\ProblemReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LineNotifyApiTest extends TestCase
{
    use RefreshDatabase;

    // ========================================
    // LINE Notify - Send
    // ========================================

    /** @test */
    public function user_can_send_line_notify_message(): void
    {
        $user = User::factory()->create();
        LineNotifyToken::create([
            'user_id' => $user->id,
            'token' => 'test_notify_token_123',
        ]);

        Http::fake([
            'notify-api.line.me/api/notify' => Http::response(['status' => 200, 'message' => 'ok'], 200),
        ]);

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/line-notify/send', [
                'message' => '🌱 ต้นกล้ามาแล้ววันนี้!',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Notification sent successfully',
                'data' => [
                    'status' => 200,
                    'message' => '🌱 ต้นกล้ามาแล้ววันนี้!',
                ],
            ]);
    }

    /** @test */
    public function line_notify_send_fails_without_token(): void
    {
        $user = User::factory()->create();
        // No token stored

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/line-notify/send', [
                'message' => 'Test message',
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'LINE Notify token not configured for this user. Please authorize first.',
            ]);
    }

    /** @test */
    public function line_notify_send_validates_required_message(): void
    {
        $user = User::factory()->create();
        LineNotifyToken::create([
            'user_id' => $user->id,
            'token' => 'test_token',
        ]);

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/line-notify/send', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    /** @test */
    public function line_notify_send_handles_api_failure(): void
    {
        $user = User::factory()->create();
        LineNotifyToken::create([
            'user_id' => $user->id,
            'token' => 'invalid_token',
        ]);

        Http::fake([
            'notify-api.line.me/api/notify' => Http::response(['message' => 'Invalid access token'], 401),
        ]);

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/line-notify/send', [
                'message' => 'Test message',
            ]);

        $response->assertStatus(401);
    }

    // ========================================
    // LINE Notify - Send with Image
    // ========================================

    /** @test */
    public function user_can_send_line_notify_with_image(): void
    {
        $user = User::factory()->create();
        LineNotifyToken::create([
            'user_id' => $user->id,
            'token' => 'test_notify_token_123',
        ]);

        Http::fake([
            'notify-api.line.me/api/notify' => Http::response(['status' => 200, 'message' => 'ok'], 200),
        ]);

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/line-notify/send-with-image', [
                'message' => '📸 ภาพสวนวันนี้',
                'image_url' => 'https://example.com/farm.jpg',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Notification sent successfully',
            ]);
    }

    // ========================================
    // LINE Notify - Send Task Notification
    // ========================================

    /** @test */
    public function user_can_send_task_notification(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $user = $owner;
        LineNotifyToken::create([
            'user_id' => $user->id,
            'token' => 'test_token',
        ]);

        $task = $this->createTask($farm, $owner);

        Http::fake([
            'notify-api.line.me/api/notify' => Http::response(['status' => 200, 'message' => 'ok'], 200),
        ]);

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/line-notify/send-task', [
                'task_id' => $task->id,
                'action' => 'created',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Notification sent successfully',
            ]);
    }

    /** @test */
    public function send_task_notification_validates_required_fields(): void
    {
        $user = User::factory()->create();
        LineNotifyToken::create([
            'user_id' => $user->id,
            'token' => 'test_token',
        ]);

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/line-notify/send-task-notification', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['task_id', 'action']);
    }

    /** @test */
    public function send_task_notification_validates_invalid_action(): void
    {
        $user = User::factory()->create();
        LineNotifyToken::create([
            'user_id' => $user->id,
            'token' => 'test_token',
        ]);

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/line-notify/send-task-notification', [
                'task_id' => 1,
                'action' => 'invalid_action',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['action']);
    }

    // ========================================
    // LINE Notify - Send Problem Notification
    // ========================================

    /** @test */
    public function user_can_send_problem_notification(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $user = $owner;
        LineNotifyToken::create([
            'user_id' => $user->id,
            'token' => 'test_token',
        ]);

        $problem = ProblemReport::factory()->create([
            'farm_id' => $farm->id,
            'reporter_id' => $owner->id,
        ]);

        Http::fake([
            'notify-api.line.me/api/notify' => Http::response(['status' => 200, 'message' => 'ok'], 200),
        ]);

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/line-notify/send-problem', [
                'problem_id' => $problem->id,
                'action' => 'reported',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Notification sent successfully',
            ]);
    }

    // ========================================
    // LINE Notify - Authorize Token
    // ========================================

    /** @test */
    public function user_can_authorize_line_notify_token(): void
    {
        $user = User::factory()->create();

        Http::fake([
            'notify-api.line.me/api/token' => Http::response([
                'access_token' => 'new_authorized_token_xyz',
                'expires_in' => 3600,
            ], 200),
        ]);

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/line-notify/authorize', [
                'code' => 'authorization_code_from_line',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'LINE Notify authorized successfully',
                'data' => [
                    'token' => 'new_authorized_token_xyz',
                ],
            ]);

        $this->assertDatabaseHas('line_notify_tokens', [
            'user_id' => $user->id,
        ]);
    }

    /** @test */
    public function authorize_updates_existing_token(): void
    {
        $user = User::factory()->create();
        LineNotifyToken::create([
            'user_id' => $user->id,
            'token' => 'old_token',
        ]);

        Http::fake([
            'notify-api.line.me/api/token' => Http::response([
                'access_token' => 'new_token',
                'expires_in' => 3600,
            ], 200),
        ]);

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/line-notify/authorize', [
                'code' => 'authorization_code_from_line',
            ]);

        $response->assertStatus(200);

        // Should only have one token record
        $this->assertEquals(1, LineNotifyToken::where('user_id', $user->id)->count());
        $this->assertDatabaseHas('line_notify_tokens', [
            'user_id' => $user->id,
            'token' => 'new_token',
        ]);
    }

    /** @test */
    public function authorize_fails_with_invalid_code(): void
    {
        $user = User::factory()->create();

        Http::fake([
            'notify-api.line.me/api/token' => Http::response(['message' => 'invalid grant'], 400),
        ]);

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/line-notify/authorize', [
                'code' => 'invalid_code',
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Failed to authorize with LINE Notify',
            ]);
    }

    /** @test */
    public function authorize_validates_required_code(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/line-notify/authorize', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    // ========================================
    // LINE Notify - Revoke
    // ========================================

    /** @test */
    public function user_can_revoke_line_notify_token(): void
    {
        $user = User::factory()->create();
        LineNotifyToken::create([
            'user_id' => $user->id,
            'token' => 'test_token',
        ]);

        Http::fake([
            'notify-api.line.me/api/revoke' => Http::response(['status' => 200], 200),
        ]);

        $response = $this->withHeaders($this->authHeaders($user))
            ->deleteJson('/api/line-notify/revoke');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'LINE Notify token revoked successfully',
            ]);

        $this->assertDatabaseMissing('line_notify_tokens', [
            'user_id' => $user->id,
        ]);
    }

    /** @test */
    public function revoke_fails_when_no_token_exists(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeaders($user))
            ->deleteJson('/api/line-notify/revoke');

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'No LINE Notify token found',
            ]);
    }
}

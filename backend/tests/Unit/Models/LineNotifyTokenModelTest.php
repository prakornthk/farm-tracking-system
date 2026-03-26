<?php

namespace Tests\Unit\Models;

use App\Models\LineNotifyToken;
use PHPUnit\Framework\TestCase;

class LineNotifyTokenModelTest extends TestCase
{
    /** @test */
    public function line_notify_token_model_exists(): void
    {
        $this->assertTrue(class_exists(LineNotifyToken::class));
    }

    /** @test */
    public function line_notify_token_has_correct_fillable_attributes(): void
    {
        $token = new LineNotifyToken();
        $fillable = $token->getFillable();

        $this->assertContains('user_id', $fillable);
        $this->assertContains('token', $fillable);
        $this->assertContains('expires_in', $fillable);
    }

    /** @test */
    public function line_notify_token_has_correct_casts(): void
    {
        $token = new LineNotifyToken();
        $casts = $token->getCasts();

        $this->assertEquals('integer', $casts['expires_in']);
    }

    /** @test */
    public function line_notify_token_has_hidden_token(): void
    {
        $token = new LineNotifyToken();
        $hidden = $token->getHidden();

        $this->assertContains('token', $hidden);
    }

    /** @test */
    public function line_notify_token_belongs_to_user_relationship(): void
    {
        $token = new LineNotifyToken();
        $this->assertTrue(method_exists($token, 'user'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $token->user());
    }
}

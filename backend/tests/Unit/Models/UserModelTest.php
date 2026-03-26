<?php

namespace Tests\Unit\Models;

use App\Models\User;
use PHPUnit\Framework\TestCase;

class UserModelTest extends TestCase
{
    /** @test */
    public function user_model_exists(): void
    {
        $this->assertTrue(class_exists(User::class));
    }

    /** @test */
    public function user_has_correct_fillable_attributes(): void
    {
        $user = new User();
        $fillable = $user->getFillable();

        $this->assertContains('name', $fillable);
        $this->assertContains('email', $fillable);
        $this->assertContains('role', $fillable);
        $this->assertContains('line_user_id', $fillable);
        $this->assertContains('line_display_name', $fillable);
        $this->assertContains('line_picture_url', $fillable);
    }

    /** @test */
    public function user_has_hidden_attributes(): void
    {
        $user = new User();
        $hidden = $user->getHidden();

        $this->assertContains('password', $hidden);
        $this->assertContains('remember_token', $hidden);
    }

    /** @test */
    public function user_has_correct_casts(): void
    {
        $user = new User();
        $casts = $user->getCasts();

        $this->assertEquals('datetime', $casts['email_verified_at']);
    }

    /** @test */
    public function user_uses_soft_deletes(): void
    {
        $user = new User();
        $this->assertContains('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive($user));
    }

    /** @test */
    public function user_belongs_to_many_farms_relationship(): void
    {
        $user = new User();
        $this->assertTrue(method_exists($user, 'farms'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsToMany::class, $user->farms());
    }

    /** @test */
    public function user_has_valid_roles(): void
    {
        $expected = ['super_admin', 'owner', 'manager', 'worker'];
        $this->assertEquals($expected, User::ROLES);
    }

    /** @test */
    public function user_is_super_admin(): void
    {
        $user = new User(['role' => 'super_admin']);
        $this->assertTrue($user->isSuperAdmin());
        $this->assertFalse($user->isOwner());
        $this->assertFalse($user->isManager());
        $this->assertFalse($user->isWorker());
    }

    /** @test */
    public function user_is_owner(): void
    {
        $user = new User(['role' => 'owner']);
        $this->assertFalse($user->isSuperAdmin());
        $this->assertTrue($user->isOwner());
        $this->assertFalse($user->isManager());
        $this->assertFalse($user->isWorker());
    }

    /** @test */
    public function user_is_manager(): void
    {
        $user = new User(['role' => 'manager']);
        $this->assertFalse($user->isSuperAdmin());
        $this->assertFalse($user->isOwner());
        $this->assertTrue($user->isManager());
        $this->assertFalse($user->isWorker());
    }

    /** @test */
    public function user_is_worker(): void
    {
        $user = new User(['role' => 'worker']);
        $this->assertFalse($user->isSuperAdmin());
        $this->assertFalse($user->isOwner());
        $this->assertFalse($user->isManager());
        $this->assertTrue($user->isWorker());
    }

    /** @test */
    public function user_has_api_tokens_trait(): void
    {
        $user = new User();
        $this->assertContains('Laravel\Sanctum\HasApiTokens', class_uses_recursive($user));
    }
}

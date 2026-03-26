<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'line_user_id',
        'line_display_name',
        'line_picture_url',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Get the farms that the user belongs to.
     */
    public function farms(): BelongsToMany
    {
        return $this->belongsToMany(Farm::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Get activities created by this user.
     */
    public function activities()
    {
        return $this->hasMany(Activity::class);
    }

    /**
     * Get tasks created by this user.
     */
    public function createdTasks()
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    /**
     * Get task assignments for this user.
     */
    public function taskAssignments()
    {
        return $this->hasMany(TaskAssignment::class);
    }

    /**
     * Get problem reports reported by this user.
     */
    public function problemReports()
    {
        return $this->hasMany(ProblemReport::class, 'reporter_id');
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string|array $roles): bool
    {
        if (is_string($roles)) {
            return $this->role === $roles;
        }

        return in_array($this->role, $roles);
    }

    /**
     * Check if user is super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Get user's role in a specific farm.
     */
    public function getFarmRole(Farm $farm): ?string
    {
        $pivot = $this->farms()->where('farm_id', $farm->id)->first();
        return $pivot?->pivot?->role;
    }
}

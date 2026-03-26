<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Farm extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'location',
        'latitude',
        'longitude',
        'qr_code',
        'is_active',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'is_active' => 'boolean',
    ];

    /**
     * Get the users that belong to this farm.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Get zones in this farm.
     */
    public function zones(): HasMany
    {
        return $this->hasMany(Zone::class);
    }

    /**
     * Get activities in this farm.
     */
    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    /**
     * Get tasks in this farm.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get problem reports in this farm.
     */
    public function problemReports(): HasMany
    {
        return $this->hasMany(ProblemReport::class);
    }

    /**
     * Get total zones count.
     */
    public function getZonesCountAttribute(): int
    {
        return $this->zones()->count();
    }

    /**
     * Get total plots count.
     */
    public function getPlotsCountAttribute(): int
    {
        return $this->zones->sum(function ($zone) {
            return $zone->plots()->count();
        });
    }

    /**
     * Get total plants count.
     */
    public function getPlantsCountAttribute(): int
    {
        return $this->zones->sum(function ($zone) {
            return $zone->plots->sum(function ($plot) {
                return $plot->plants()->count();
            });
        });
    }
}

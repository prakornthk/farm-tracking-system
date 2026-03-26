<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Zone extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'farm_id',
        'name',
        'description',
        'qr_code',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Get the farm that owns this zone.
     */
    public function farm(): BelongsTo
    {
        return $this->belongsTo(Farm::class);
    }

    /**
     * Get plots in this zone.
     */
    public function plots(): HasMany
    {
        return $this->hasMany(Plot::class)->orderBy('sort_order');
    }

    /**
     * Get tasks for this zone.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get total plots count.
     */
    public function getPlotsCountAttribute(): int
    {
        return $this->plots()->count();
    }

    /**
     * Get total plants count.
     */
    public function getPlantsCountAttribute(): int
    {
        return $this->plots->sum(function ($plot) {
            return $plot->plants()->count();
        });
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Activity extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'farm_id',
        'activitable_type',
        'activitable_id',
        'type',
        'description',
        'quantity',
        'quantity_unit',
        'yield_amount',
        'yield_unit',
        'yield_price_per_unit',
        'yield_total_value',
        'metadata',
        'activity_date',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'yield_amount' => 'decimal:2',
        'yield_price_per_unit' => 'decimal:2',
        'yield_total_value' => 'decimal:2',
        'metadata' => 'array',
        'activity_date' => 'datetime',
    ];

    /**
     * Activity types.
     */
    const ACTIVITY_TYPES = [
        'watering',
        'fertilizing',
        'pesticide',
        'spraying',
        'weeding',
        'pruning',
        'harvesting',
        'inspection',
        'planting',
        'soil_preparation',
        'other',
    ];

    /**
     * Get the user who created this activity.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the farm this activity belongs to.
     */
    public function farm(): BelongsTo
    {
        return $this->belongsTo(Farm::class);
    }

    /**
     * Get the parent activitable model (Plot or Plant).
     */
    public function activitable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Check if this is a harvest activity.
     */
    public function isHarvest(): bool
    {
        return $this->type === 'harvesting';
    }

    /**
     * Get the yield details if this is a harvest.
     */
    public function getYieldDetailsAttribute(): ?array
    {
        if (!$this->isHarvest()) {
            return null;
        }

        return [
            'amount' => $this->yield_amount,
            'unit' => $this->yield_unit,
            'price_per_unit' => $this->yield_price_per_unit,
            'total_value' => $this->yield_total_value,
        ];
    }

    /**
     * Calculate yield total value if not set.
     */
    public function calculateYieldValue(): void
    {
        if ($this->yield_amount && $this->yield_price_per_unit && !$this->yield_total_value) {
            $this->yield_total_value = $this->yield_amount * $this->yield_price_per_unit;
        }
    }
}

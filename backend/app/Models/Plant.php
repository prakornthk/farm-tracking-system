<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Plant extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Plant status values per spec.
     */
    const STATUSES = ['normal', 'problem', 'dead', 'harvested'];

    protected $fillable = [
        'plot_id',
        'name',
        'variety',
        'qr_code',
        'qr_code_data',
        'planted_date',
        'expected_harvest_date',
        'status',
        'quantity',
        'notes',
        'code',
        'species',
        'latest_image_url',
    ];

    protected $casts = [
        'planted_date' => 'date',
        'expected_harvest_date' => 'date',
        'quantity' => 'integer',
    ];

    /**
     * Get the plot that owns this plant.
     */
    public function plot(): BelongsTo
    {
        return $this->belongsTo(Plot::class);
    }

    /**
     * Get the farm through plot relationship.
     */
    public function farm(): Farm
    {
        return $this->plot->farm;
    }

    /**
     * Get the zone through plot relationship.
     */
    public function zone(): Zone
    {
        return $this->plot->zone;
    }

    /**
     * Get activities for this plant (polymorphic).
     */
    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'activitable');
    }

    /**
     * Get problem reports for this plant.
     */
    public function problemReports(): HasMany
    {
        return $this->hasMany(ProblemReport::class);
    }

    /**
     * Get QR code data for generating QR.
     */
    public function getQrDataAttribute(): string
    {
        return json_encode([
            'type' => 'plant',
            'farm_id' => $this->farm->id,
            'zone_id' => $this->zone->id,
            'plot_id' => $this->plot->id,
            'plant_id' => $this->id,
        ]);
    }

    /**
     * Calculate days since planting.
     */
    public function getDaysSincePlantedAttribute(): ?int
    {
        if (!$this->planted_date) {
            return null;
        }

        return $this->planted_date->diffInDays(now());
    }

    /**
     * Calculate days until expected harvest.
     */
    public function getDaysUntilHarvestAttribute(): ?int
    {
        if (!$this->expected_harvest_date) {
            return null;
        }

        return now()->diffInDays($this->expected_harvest_date, false);
    }
}

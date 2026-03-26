<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Plot extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Plot status values per spec.
     */
    const STATUSES = ['active', 'inactive', 'harvested'];

    protected $fillable = [
        'zone_id',
        'name',
        'description',
        'size',
        'size_unit',
        'qr_code',
        'qr_code_data',
        'status',
        'sort_order',
        'is_active',
        'code',
        'crop_type',
        'total_plants',
        'area',
        'image_url',
        'note',
    ];

    protected $casts = [
        'size' => 'decimal:2',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Get the zone that owns this plot.
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    /**
     * Get the farm through zone relationship.
     */
    public function farm(): Farm
    {
        return $this->zone->farm;
    }

    /**
     * Get plants in this plot.
     */
    public function plants(): HasMany
    {
        return $this->hasMany(Plant::class);
    }

    /**
     * Get activities for this plot (polymorphic).
     */
    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'activitable');
    }

    /**
     * Get tasks for this plot.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get problem reports for this plot.
     */
    public function problemReports(): HasMany
    {
        return $this->hasMany(ProblemReport::class);
    }

    /**
     * Get total plants count.
     */
    public function getPlantsCountAttribute(): int
    {
        return $this->plants()->count();
    }

    /**
     * Get QR code data for generating QR.
     */
    public function getQrDataAttribute(): string
    {
        return json_encode([
            'type' => 'plot',
            'farm_id' => $this->farm->id,
            'zone_id' => $this->zone->id,
            'plot_id' => $this->id,
        ]);
    }
}

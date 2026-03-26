<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProblemReport extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'farm_id',
        'reporter_id',
        'plot_id',
        'plant_id',
        'type',
        'severity',
        'status',
        'title',
        'description',
        'symptoms',
        'suspected_cause',
        'resolution',
        'image_url',
        'metadata',
        'resolved_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'resolved_at' => 'datetime',
    ];

    /**
     * Severity levels.
     */
    const SEVERITIES = [
        'low',
        'medium',
        'high',
        'critical',
    ];

    /**
     * Problem types per spec.
     */
    const PROBLEM_TYPES = ['disease', 'pest', 'dead'];

    /**
     * Statuses.
     */
    const STATUSES = [
        'reported',
        'investigating',
        'resolved',
        'dismissed',
    ];

    /**
     * Get the farm this report belongs to.
     */
    public function farm(): BelongsTo
    {
        return $this->belongsTo(Farm::class);
    }

    /**
     * Get the user who reported this issue.
     */
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    /**
     * Get the plot associated with this report.
     */
    public function plot(): BelongsTo
    {
        return $this->belongsTo(Plot::class);
    }

    /**
     * Get the plant associated with this report.
     */
    public function plant(): BelongsTo
    {
        return $this->belongsTo(Plant::class);
    }

    /**
     * Check if report is resolved.
     */
    public function getIsResolvedAttribute(): bool
    {
        return $this->status === 'resolved';
    }

    /**
     * Mark report as resolved.
     */
    public function resolve(string $resolution): void
    {
        $this->update([
            'status' => 'resolved',
            'resolution' => $resolution,
            'resolved_at' => now(),
        ]);
    }

    /**
     * Mark report as investigating.
     */
    public function markInvestigating(): void
    {
        $this->update([
            'status' => 'investigating',
        ]);
    }
}

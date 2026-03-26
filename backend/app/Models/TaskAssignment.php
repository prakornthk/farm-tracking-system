<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'status',
        'notes',
        'assigned_at',
        'accepted_at',
        'completed_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'accepted_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the task for this assignment.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the user assigned to this task.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if assignment is pending.
     */
    public function getIsPendingAttribute(): bool
    {
        return $this->status === 'assigned';
    }

    /**
     * Accept the assignment.
     */
    public function accept(): void
    {
        $this->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);
    }

    /**
     * Reject the assignment.
     */
    public function reject(): void
    {
        $this->update([
            'status' => 'rejected',
        ]);
    }

    /**
     * Complete the assignment.
     */
    public function complete(?string $notes = null): void
    {
        $updateData = [
            'status' => 'completed',
            'completed_at' => now(),
        ];

        if ($notes) {
            $updateData['notes'] = $notes;
        }

        $this->update($updateData);
    }
}

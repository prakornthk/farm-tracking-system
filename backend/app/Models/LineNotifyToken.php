<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LineNotifyToken extends Model
{
    protected $fillable = [
        'user_id',
        'token',
        'expires_in',
    ];

    protected $casts = [
        'expires_in' => 'integer',
    ];

    protected $hidden = [
        'token',
    ];

    /**
     * Get the user that owns this LINE Notify token.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

<?php

namespace App\Http\Middleware;

use App\Models\Farm;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to verify the authenticated user has access to the specified farm.
 * Expects a {farmId} route parameter.
 *
 * Usage: ->middleware('can-access-farm')
 */
class CheckFarmAccess
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        // Super admin bypasses all farm access checks
        if ($user->role === 'super_admin') {
            return $next($request);
        }

        // Try to get farm_id from route parameter
        $farmId = $request->route('farmId')
            ?? $request->route('id')
            ?? $request->route('farm_id')
            ?? $request->input('farm_id');

        if (!$farmId) {
            // No farm ID in request - pass through (some routes don't need farm access)
            return $next($request);
        }

        // Verify user belongs to this farm
        $hasAccess = Farm::where('id', $farmId)
            ->whereHas('users', fn($q) => $q->where('users.id', $user->id))
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden: You do not have access to this farm',
            ], 403);
        }

        return $next($request);
    }
}

<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Interfaces\UserRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserRepository implements UserRepositoryInterface
{
    /**
     * Get all users with pagination.
     */
    public function getAll(Request $request)
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->with(['farms'])
            ->orderBy('name')
            ->paginate($request->input('per_page', 15));
    }

    /**
     * Get user by ID.
     */
    public function getById(int $id)
    {
        return User::with(['farms'])->findOrFail($id);
    }

    /**
     * Get user by LINE user ID.
     */
    public function getByLineId(string $lineUserId)
    {
        return User::where('line_user_id', $lineUserId)->first();
    }

    /**
     * Create a new user.
     */
    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            return User::create($data);
        });
    }

    /**
     * Update user.
     */
    public function update(int $id, array $data)
    {
        $user = User::findOrFail($id);
        $user->update($data);
        return $user->fresh(['farms']);
    }

    /**
     * Delete user.
     */
    public function delete(int $id)
    {
        $user = User::findOrFail($id);
        return $user->delete();
    }

    /**
     * Find or create user by LINE user data.
     */
    public function findOrCreateByLine(array $lineUser)
    {
        return DB::transaction(function () use ($lineUser) {
            $user = User::where('line_user_id', $lineUser['user_id'])->first();

            if (!$user) {
                $user = User::create([
                    'line_user_id' => $lineUser['user_id'],
                    'line_display_name' => $lineUser['display_name'] ?? null,
                    'line_picture_url' => $lineUser['picture_url'] ?? null,
                    'name' => $lineUser['display_name'] ?? 'LINE User',
                    'role' => 'worker', // Default role for new LINE users
                ]);
            } else {
                // Update LINE info if changed
                $user->update([
                    'line_display_name' => $lineUser['display_name'] ?? $user->line_display_name,
                    'line_picture_url' => $lineUser['picture_url'] ?? $user->line_picture_url,
                ]);
            }

            return $user;
        });
    }
}

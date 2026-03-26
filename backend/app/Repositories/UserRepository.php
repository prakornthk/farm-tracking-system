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
}

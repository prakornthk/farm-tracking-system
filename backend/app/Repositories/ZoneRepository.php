<?php

namespace App\Repositories;

use App\Models\Zone;
use App\Repositories\Interfaces\ZoneRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ZoneRepository implements ZoneRepositoryInterface
{
    /**
     * Get all zones for a farm.
     */
    public function getAllByFarm(int $farmId, Request $request)
    {
        $query = Zone::where('farm_id', $farmId);

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->with(['plots.plants'])
            ->orderBy('sort_order')
            ->paginate($request->input('per_page', 15));
    }

    /**
     * Get zone by ID.
     */
    public function getById(int $id)
    {
        return Zone::with(['farm', 'plots.plants'])->findOrFail($id);
    }

    /**
     * Create a new zone.
     */
    public function create(int $farmId, array $data)
    {
        return DB::transaction(function () use ($farmId, $data) {
            $data['farm_id'] = $farmId;
            return Zone::create($data);
        });
    }

    /**
     * Update zone.
     */
    public function update(int $id, array $data)
    {
        $zone = Zone::findOrFail($id);
        $zone->update($data);
        return $zone->fresh(['plots.plants']);
    }

    /**
     * Delete zone.
     */
    public function delete(int $id)
    {
        $zone = Zone::findOrFail($id);
        return $zone->delete();
    }
}

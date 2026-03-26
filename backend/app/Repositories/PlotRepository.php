<?php

namespace App\Repositories;

use App\Models\Plot;
use App\Repositories\Interfaces\PlotRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlotRepository implements PlotRepositoryInterface
{
    /**
     * Get all plots for a zone.
     */
    public function getAllByZone(int $zoneId, Request $request)
    {
        $query = Plot::where('zone_id', $zoneId);

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

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

        return $query->with(['plants'])
            ->orderBy('sort_order')
            ->paginate(min((int) $request->input('per_page', 15), 100));
    }

    /**
     * Get plot by ID.
     */
    public function getById(int $id)
    {
        return Plot::with(['zone.farm', 'plants', 'activities' => function ($q) {
            $q->latest()->limit(20);
        }])->findOrFail($id);
    }

    /**
     * Create a new plot.
     */
    public function create(int $zoneId, array $data)
    {
        return DB::transaction(function () use ($zoneId, $data) {
            $data['zone_id'] = $zoneId;

            // Generate QR code data
            if (!isset($data['qr_code_data'])) {
                $zone = \App\Models\Zone::findOrFail($zoneId);
                $data['qr_code_data'] = json_encode([
                    'type' => 'plot',
                    'farm_id' => $zone->farm_id,
                    'zone_id' => $zoneId,
                    'plot_id' => 'NEW', // Will be replaced after creation
                ]);
            }

            return Plot::create($data);
        });
    }

    /**
     * Update plot.
     */
    public function update(int $id, array $data)
    {
        $plot = Plot::findOrFail($id);
        $plot->update($data);
        return $plot->fresh(['plants']);
    }

    /**
     * Delete plot.
     */
    public function delete(int $id)
    {
        $plot = Plot::findOrFail($id);
        return $plot->delete();
    }
}

<?php

namespace App\Repositories;

use App\Models\Plant;
use App\Repositories\Interfaces\PlantRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlantRepository implements PlantRepositoryInterface
{
    /**
     * Get all plants for a plot.
     */
    public function getAllByPlot(int $plotId, Request $request)
    {
        $query = Plant::where('plot_id', $plotId);

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('variety', 'like', "%{$search}%");
            });
        }

        return $query->with(['activities' => function ($q) {
            $q->latest()->limit(10);
        }])
            ->orderBy('planted_date', 'desc')
            ->paginate(min((int) $request->input('per_page', 15), 100));
    }

    /**
     * Get plant by ID.
     */
    public function getById(int $id)
    {
        return Plant::with(['plot.zone.farm', 'activities' => function ($q) {
            $q->latest()->limit(20);
        }, 'problemReports'])->findOrFail($id);
    }

    /**
     * Create a new plant.
     */
    public function create(int $plotId, array $data)
    {
        return DB::transaction(function () use ($plotId, $data) {
            $data['plot_id'] = $plotId;

            // Generate QR code data
            if (!isset($data['qr_code_data'])) {
                $plot = \App\Models\Plot::with('zone')->findOrFail($plotId);
                $data['qr_code_data'] = json_encode([
                    'type' => 'plant',
                    'farm_id' => $plot->zone->farm_id,
                    'zone_id' => $plot->zone_id,
                    'plot_id' => $plotId,
                    'plant_id' => 'NEW',
                ]);
            }

            return Plant::create($data);
        });
    }

    /**
     * Update plant.
     */
    public function update(int $id, array $data)
    {
        $plant = Plant::findOrFail($id);
        $plant->update($data);
        return $plant->fresh();
    }

    /**
     * Delete plant.
     */
    public function delete(int $id)
    {
        $plant = Plant::findOrFail($id);
        return $plant->delete();
    }

    /**
     * Find plant by QR code.
     */
    public function getByQrCode(string $qrCode)
    {
        return Plant::with(['plot.zone.farm'])->where('qr_code', $qrCode)->first();
    }
}

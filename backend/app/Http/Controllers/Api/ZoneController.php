<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\ZoneStoreRequest;
use App\Http\Requests\ZoneUpdateRequest;
use App\Models\Zone;
use App\Repositories\Interfaces\ZoneRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ZoneController extends ApiController
{
    public function __construct(
        private ZoneRepositoryInterface $zoneRepository
    ) {}

    /**
     * Display a listing of zones for a farm.
     */
    public function index(Request $request, int $farmId): JsonResponse
    {
        // Verify farm exists
        Zone::where('farm_id', $farmId)->firstOrFail();

        $zones = $this->zoneRepository->getAllByFarm($farmId, $request);
        return $this->paginated($zones, 'Zones retrieved successfully');
    }

    /**
     * Store a newly created zone.
     */
    public function store(ZoneStoreRequest $request, int $farmId): JsonResponse
    {
        $zone = $this->zoneRepository->create($farmId, $request->validated());
        return $this->success($zone, 'Zone created successfully', 201);
    }

    /**
     * Display the specified zone.
     */
    public function show(int $id): JsonResponse
    {
        $zone = $this->zoneRepository->getById($id);
        return $this->success($zone, 'Zone retrieved successfully');
    }

    /**
     * Update the specified zone.
     */
    public function update(ZoneUpdateRequest $request, int $id): JsonResponse
    {
        $zone = $this->zoneRepository->update($id, $request->validated());
        return $this->success($zone, 'Zone updated successfully');
    }

    /**
     * Remove the specified zone.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->zoneRepository->delete($id);
        return $this->success(null, 'Zone deleted successfully');
    }
}

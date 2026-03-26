<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\PlotStoreRequest;
use App\Http\Requests\PlotUpdateRequest;
use App\Models\Plot;
use App\Repositories\Interfaces\PlotRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlotController extends ApiController
{
    public function __construct(
        private PlotRepositoryInterface $plotRepository
    ) {}

    /**
     * Display a listing of plots for a zone.
     */
    public function index(Request $request, int $zoneId): JsonResponse
    {
        // Verify zone exists
        Plot::whereHas('zone', function ($q) use ($zoneId) {
            $q->where('id', $zoneId);
        })->firstOrFail();

        $plots = $this->plotRepository->getAllByZone($zoneId, $request);
        return $this->paginated($plots, 'Plots retrieved successfully');
    }

    /**
     * Store a newly created plot.
     */
    public function store(PlotStoreRequest $request, int $zoneId): JsonResponse
    {
        $plot = $this->plotRepository->create($zoneId, $request->validated());
        return $this->success($plot, 'Plot created successfully', 201);
    }

    /**
     * Display the specified plot.
     */
    public function show(int $id): JsonResponse
    {
        $plot = $this->plotRepository->getById($id);
        return $this->success($plot, 'Plot retrieved successfully');
    }

    /**
     * Update the specified plot.
     */
    public function update(PlotUpdateRequest $request, int $id): JsonResponse
    {
        $plot = $this->plotRepository->update($id, $request->validated());
        return $this->success($plot, 'Plot updated successfully');
    }

    /**
     * Remove the specified plot.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->plotRepository->delete($id);
        return $this->success(null, 'Plot deleted successfully');
    }
}

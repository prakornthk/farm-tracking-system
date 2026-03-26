<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\FarmStoreRequest;
use App\Http\Requests\FarmUpdateRequest;
use App\Repositories\Interfaces\FarmRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FarmController extends ApiController
{
    public function __construct(
        private FarmRepositoryInterface $farmRepository
    ) {}

    /**
     * Display a listing of farms.
     */
    public function index(Request $request): JsonResponse
    {
        $farms = $this->farmRepository->getAll($request);
        return $this->paginated($farms, 'Farms retrieved successfully');
    }

    /**
     * Store a newly created farm.
     */
    public function store(FarmStoreRequest $request): JsonResponse
    {
        $farm = $this->farmRepository->create($request->validated());
        return $this->success($farm, 'Farm created successfully', 201);
    }

    /**
     * Display the specified farm.
     */
    public function show(int $id): JsonResponse
    {
        $farm = $this->farmRepository->getById($id);
        return $this->success($farm, 'Farm retrieved successfully');
    }

    /**
     * Update the specified farm.
     */
    public function update(FarmUpdateRequest $request, int $id): JsonResponse
    {
        $farm = $this->farmRepository->update($id, $request->validated());
        return $this->success($farm, 'Farm updated successfully');
    }

    /**
     * Remove the specified farm.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->farmRepository->delete($id);
        return $this->success(null, 'Farm deleted successfully');
    }

    /**
     * Get farm with all relations.
     */
    public function withRelations(int $id): JsonResponse
    {
        $farm = $this->farmRepository->getWithRelations($id);
        return $this->success($farm, 'Farm with relations retrieved successfully');
    }

    /**
     * Get farm metrics for dashboard.
     */
    public function metrics(Request $request, int $id): JsonResponse
    {
        $metrics = $this->farmRepository->getMetrics($id, $request);
        return $this->success($metrics, 'Farm metrics retrieved successfully');
    }

    /**
     * Get users belonging to a farm.
     */
    public function users(int $id): JsonResponse
    {
        $farm = $this->farmRepository->getById($id);
        return $this->success($farm->users, 'Farm users retrieved successfully');
    }
}

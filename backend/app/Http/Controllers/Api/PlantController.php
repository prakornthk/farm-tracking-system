<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\PlantStoreRequest;
use App\Http\Requests\PlantUpdateRequest;
use App\Models\Plant;
use App\Repositories\Interfaces\PlantRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlantController extends ApiController
{
    public function __construct(
        private PlantRepositoryInterface $plantRepository
    ) {}

    /**
     * Display a listing of plants for a plot.
     */
    public function index(Request $request, int $plotId): JsonResponse
    {
        // Verify plot exists
        Plant::whereHas('plot', function ($q) use ($plotId) {
            $q->where('id', $plotId);
        })->firstOrFail();

        $plants = $this->plantRepository->getAllByPlot($plotId, $request);
        return $this->paginated($plants, 'Plants retrieved successfully');
    }

    /**
     * Store a newly created plant.
     */
    public function store(PlantStoreRequest $request, int $plotId): JsonResponse
    {
        $plant = $this->plantRepository->create($plotId, $request->validated());
        return $this->success($plant, 'Plant created successfully', 201);
    }

    /**
     * Display the specified plant.
     */
    public function show(int $id): JsonResponse
    {
        $plant = $this->plantRepository->getById($id);
        return $this->success($plant, 'Plant retrieved successfully');
    }

    /**
     * Update the specified plant.
     */
    public function update(PlantUpdateRequest $request, int $id): JsonResponse
    {
        $plant = $this->plantRepository->update($id, $request->validated());
        return $this->success($plant, 'Plant updated successfully');
    }

    /**
     * Remove the specified plant.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->plantRepository->delete($id);
        return $this->success(null, 'Plant deleted successfully');
    }

    /**
     * Find plant by QR code.
     */
    public function findByQrCode(Request $request): JsonResponse
    {
        $request->validate([
            'qr_code' => 'required|string',
        ]);

        $plant = $this->plantRepository->getByQrCode($request->input('qr_code'));

        if (!$plant) {
            return $this->error('Plant not found', 404);
        }

        return $this->success($plant, 'Plant found successfully');
    }
}

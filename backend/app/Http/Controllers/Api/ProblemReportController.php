<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\ProblemReportStoreRequest;
use App\Http\Requests\ProblemReportUpdateRequest;
use App\Repositories\Interfaces\ProblemReportRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProblemReportController extends ApiController
{
    public function __construct(
        private ProblemReportRepositoryInterface $problemReportRepository
    ) {}

    /**
     * Display a listing of problem reports.
     */
    public function index(Request $request): JsonResponse
    {
        $reports = $this->problemReportRepository->getAll($request);
        return $this->paginated($reports, 'Problem reports retrieved successfully');
    }

    /**
     * Store a newly created problem report.
     */
    public function store(ProblemReportStoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['reporter_id'] = $request->user()->id;

        $report = $this->problemReportRepository->create($data);
        return $this->success($report, 'Problem report created successfully', 201);
    }

    /**
     * Display the specified problem report.
     */
    public function show(int $id): JsonResponse
    {
        $report = $this->problemReportRepository->getById($id);
        return $this->success($report, 'Problem report retrieved successfully');
    }

    /**
     * Update the specified problem report.
     */
    public function update(ProblemReportUpdateRequest $request, int $id): JsonResponse
    {
        $report = $this->problemReportRepository->update($id, $request->validated());
        return $this->success($report, 'Problem report updated successfully');
    }

    /**
     * Remove the specified problem report.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->problemReportRepository->delete($id);
        return $this->success(null, 'Problem report deleted successfully');
    }

    /**
     * Get problem reports for a specific farm.
     */
    public function byFarm(Request $request, int $farmId): JsonResponse
    {
        $reports = $this->problemReportRepository->getByFarm($farmId, $request);
        return $this->paginated($reports, 'Farm problem reports retrieved successfully');
    }
}

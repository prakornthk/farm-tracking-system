<?php

namespace App\Repositories;

use App\Models\ProblemReport;
use App\Repositories\Interfaces\ProblemReportRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProblemReportRepository implements ProblemReportRepositoryInterface
{
    /**
     * Get all problem reports with pagination.
     */
    public function getAll(Request $request)
    {
        $query = ProblemReport::with(['reporter', 'farm', 'plot', 'plant']);

        if ($request->has('farm_id')) {
            $query->where('farm_id', $request->input('farm_id'));
        }

        if ($request->has('severity')) {
            $query->where('severity', $request->input('severity'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('reporter_id')) {
            $query->where('reporter_id', $request->input('reporter_id'));
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));
    }

    /**
     * Get problem report by ID.
     */
    public function getById(int $id)
    {
        return ProblemReport::with(['reporter', 'farm', 'plot', 'plant'])->findOrFail($id);
    }

    /**
     * Create a new problem report.
     */
    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            return ProblemReport::create($data);
        });
    }

    /**
     * Update problem report.
     */
    public function update(int $id, array $data)
    {
        $report = ProblemReport::findOrFail($id);

        return DB::transaction(function () use ($report, $data) {
            // Handle status change to resolved
            if (isset($data['status']) && $data['status'] === 'resolved') {
                $data['resolved_at'] = now();
            }

            $report->update($data);
            return $report->fresh();
        });
    }

    /**
     * Delete problem report.
     */
    public function delete(int $id)
    {
        $report = ProblemReport::findOrFail($id);
        return $report->delete();
    }

    /**
     * Get problem reports for a specific farm.
     */
    public function getByFarm(int $farmId, Request $request)
    {
        $query = ProblemReport::where('farm_id', $farmId)
            ->with(['reporter', 'plot', 'plant']);

        if ($request->has('severity')) {
            $query->where('severity', $request->input('severity'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));
    }
}

<?php

namespace App\Repositories\Interfaces;

use Illuminate\Http\Request;

interface ProblemReportRepositoryInterface
{
    public function getAll(Request $request);
    public function getById(int $id);
    public function create(array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
    public function getByFarm(int $farmId, Request $request);
}

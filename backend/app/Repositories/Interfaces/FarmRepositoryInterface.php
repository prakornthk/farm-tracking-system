<?php

namespace App\Repositories\Interfaces;

use Illuminate\Http\Request;

interface FarmRepositoryInterface
{
    public function getAll(Request $request);
    public function getById(int $id);
    public function create(array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
    public function getWithRelations(int $id);
    public function getMetrics(int $farmId, Request $request);
}

<?php

namespace App\Repositories\Interfaces;

use Illuminate\Http\Request;

interface ActivityRepositoryInterface
{
    public function getAll(Request $request);
    public function getById(int $id);
    public function create(array $data);
    public function createBatch(array $activities);
    public function getByTarget(string $type, int $id, Request $request);
}

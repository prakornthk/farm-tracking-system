<?php

namespace App\Repositories\Interfaces;

use Illuminate\Http\Request;

interface ZoneRepositoryInterface
{
    public function getAllByFarm(int $farmId, Request $request);
    public function getById(int $id);
    public function create(int $farmId, array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
}

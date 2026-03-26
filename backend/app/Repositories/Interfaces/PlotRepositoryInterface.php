<?php

namespace App\Repositories\Interfaces;

use Illuminate\Http\Request;

interface PlotRepositoryInterface
{
    public function getAllByZone(int $zoneId, Request $request);
    public function getById(int $id);
    public function create(int $zoneId, array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
}

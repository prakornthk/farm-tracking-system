<?php

namespace App\Repositories\Interfaces;

use Illuminate\Http\Request;

interface PlantRepositoryInterface
{
    public function getAllByPlot(int $plotId, Request $request);
    public function getById(int $id);
    public function create(int $plotId, array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
    public function getByQrCode(string $qrCode);
}

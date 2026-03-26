<?php

namespace App\Repositories\Interfaces;

use App\Models\User;
use Illuminate\Http\Request;

interface UserRepositoryInterface
{
    public function getAll(Request $request);
    public function getById(int $id);
    public function getByLineId(string $lineUserId);
    public function create(array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
    public function findOrCreateByLine(array $lineUser);
}

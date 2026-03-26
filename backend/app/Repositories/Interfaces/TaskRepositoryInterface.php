<?php

namespace App\Repositories\Interfaces;

use Illuminate\Http\Request;

interface TaskRepositoryInterface
{
    public function getAll(Request $request);
    public function getById(int $id);
    public function create(array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
    public function assignUsers(int $taskId, array $userIds);
    public function updateAssignmentStatus(int $taskId, int $userId, string $status, ?string $notes = null);
}

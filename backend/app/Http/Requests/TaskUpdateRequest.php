<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;

class TaskUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'type' => 'nullable|in:activity,harvest,maintenance,inspection,other',
            'priority' => 'nullable|in:' . implode(',', Task::PRIORITIES),
            'status' => 'nullable|in:' . implode(',', Task::STATUSES),
            'due_date' => 'nullable|date',
            'plot_id' => 'nullable|exists:plots,id',
            'zone_id' => 'nullable|exists:zones,id',
            'assigned_users' => 'nullable|array',
            'assigned_users.*' => 'exists:users,id',
            'metadata' => 'nullable|array',
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlotUpdateRequest extends FormRequest
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
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'size' => 'nullable|numeric|min:0',
            'size_unit' => 'nullable|string|in:sqm,rai,hectare',
            'status' => 'nullable|in:active,inactive,harvested',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ];
    }
}

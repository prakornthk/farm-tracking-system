<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlantStoreRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'variety' => 'nullable|string|max:255',
            'planted_date' => 'nullable|date',
            'expected_harvest_date' => 'nullable|date|after_or_equal:planted_date',
            'status' => 'nullable|in:seedling,vegetative,flowering,fruiting,harvested,dead,removed',
            'quantity' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:2000',
        ];
    }
}

<?php

namespace App\Http\Requests;

use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;

class ActivityStoreRequest extends FormRequest
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
            'farm_id' => 'nullable|exists:farms,id',
            'activitable_type' => 'required|in:App\Models\Plot,App\Models\Plant',
            'activitable_id' => 'required|integer',
            'type' => 'required|in:' . implode(',', Activity::ACTIVITY_TYPES),
            'description' => 'nullable|string|max:1000',
            'quantity' => 'nullable|numeric|min:0',
            'quantity_unit' => 'nullable|string|max:50',
            'yield_amount' => 'nullable|numeric|min:0',
            'yield_unit' => 'nullable|string|max:50',
            'yield_price_per_unit' => 'nullable|numeric|min:0',
            'metadata' => 'nullable|array',
            'activity_date' => 'nullable|date',
            'image_url' => 'nullable|url|max:500',
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'activitable_type.in' => 'Target must be a Plot or Plant',
            'type.in' => 'Invalid activity type. Valid types: ' . implode(', ', Activity::ACTIVITY_TYPES),
        ];
    }
}

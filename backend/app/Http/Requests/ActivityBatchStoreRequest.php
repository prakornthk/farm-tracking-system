<?php

namespace App\Http\Requests;

use App\Models\Activity;
use Illuminate\Foundation\Http\FormRequest;

class ActivityBatchStoreRequest extends FormRequest
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
            'activities' => 'required|array|min:1|max:50',
            'activities.*.farm_id' => 'nullable|exists:farms,id',
            'activities.*.activitable_type' => 'required|in:App\Models\Plot,App\Models\Plant',
            'activities.*.activitable_id' => 'required|integer',
            'activities.*.type' => 'required|in:' . implode(',', Activity::ACTIVITY_TYPES),
            'activities.*.description' => 'nullable|string|max:1000',
            'activities.*.quantity' => 'nullable|numeric|min:0',
            'activities.*.quantity_unit' => 'nullable|string|max:50',
            'activities.*.yield_amount' => 'nullable|numeric|min:0',
            'activities.*.yield_unit' => 'nullable|string|max:50',
            'activities.*.yield_price_per_unit' => 'nullable|numeric|min:0',
            'activities.*.metadata' => 'nullable|array',
            'activities.*.activity_date' => 'nullable|date',
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'activities.required' => 'At least one activity is required',
            'activities.max' => 'Maximum 50 activities can be submitted at once',
            'activities.*.activitable_type.in' => 'Each target must be a Plot or Plant',
            'activities.*.type.in' => 'Invalid activity type in batch submission',
        ];
    }
}

<?php

namespace App\Http\Requests;

use App\Models\ProblemReport;
use Illuminate\Foundation\Http\FormRequest;

class ProblemReportStoreRequest extends FormRequest
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
            'farm_id' => 'required|exists:farms,id',
            'plot_id' => 'nullable|exists:plots,id',
            'plant_id' => 'nullable|exists:plants,id',
            'severity' => 'nullable|in:' . implode(',', ProblemReport::SEVERITIES),
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'symptoms' => 'nullable|string|max:2000',
            'suspected_cause' => 'nullable|string|max:2000',
            'image_url' => 'nullable|url|max:500',
            'metadata' => 'nullable|array',
        ];
    }
}

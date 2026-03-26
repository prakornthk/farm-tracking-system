<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LineNotifySendRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Note: LINE Notify token is now retrieved server-side from the
     * authenticated user's stored token (LineNotifyToken model).
     * Clients should NOT send the token in the request body.
     */
    public function rules(): array
    {
        return [
            'message' => 'required|string|max:1000',
            'image_url' => 'nullable|url|max:500',
        ];
    }
}

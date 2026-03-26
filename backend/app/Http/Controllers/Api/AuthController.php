<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\LineLoginRequest;
use App\Models\User;
use App\Repositories\Interfaces\UserRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

class AuthController extends ApiController
{
    public function __construct(
        private UserRepositoryInterface $userRepository
    ) {}

    /**
     * Handle LINE Login callback.
     */
    public function lineCallback(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        // Exchange authorization code for access token
        $lineTokenResponse = Http::asForm()->post('https://api.line.me/oauth2/v2.1/token', [
            'grant_type' => 'authorization_code',
            'code' => $request->input('code'),
            'redirect_uri' => config('services.line.redirect'),
            'client_id' => config('services.line.client_id'),
            'client_secret' => config('services.line.client_secret'),
        ]);

        if (!$lineTokenResponse->successful()) {
            return $this->error('Failed to authenticate with LINE', 401);
        }

        $tokenData = $lineTokenResponse->json();

        // Get LINE user profile
        $lineProfileResponse = Http::withToken($tokenData['id_token'])
            ->get('https://api.line.me/v2/profile');

        if (!$lineProfileResponse->successful()) {
            return $this->error('Failed to get LINE profile', 401);
        }

        $lineProfile = $lineProfileResponse->json();

        // Find or create user
        $user = $this->userRepository->findOrCreateByLine($lineProfile);

        // Create Sanctum token
        $token = $user->createToken('line-login')->plainTextToken;

        return $this->success([
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ], 'Login successful');
    }

    /**
     * Login with LINE access token directly.
     */
    public function lineLogin(LineLoginRequest $request): JsonResponse
    {
        $accessToken = $request->input('access_token');

        // Verify access token with LINE
        $lineProfileResponse = Http::withToken($accessToken)
            ->get('https://api.line.me/v2/profile');

        if (!$lineProfileResponse->successful()) {
            return $this->error('Invalid LINE access token', 401);
        }

        $lineProfile = $lineProfileResponse->json();

        // Find or create user
        $user = $this->userRepository->findOrCreateByLine($lineProfile);

        // Create Sanctum token
        $token = $user->createToken('line-login')->plainTextToken;

        return $this->success([
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ], 'Login successful');
    }

    /**
     * Get authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('farms');
        return $this->success($user, 'User retrieved successfully');
    }

    /**
     * Logout (revoke current token).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return $this->success(null, 'Logged out successfully');
    }

    /**
     * Register a new user (for admin/system use).
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'sometimes|in:owner,manager,worker',
        ]);

        $user = $this->userRepository->create($validated);
        $token = $user->createToken('register')->plainTextToken;

        return $this->success([
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ], 'Registration successful', 201);
    }

    /**
     * Refresh token.
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Delete old token
        $user->currentAccessToken()->delete();
        
        // Create new token
        $token = $user->createToken('refresh')->plainTextToken;

        return $this->success([
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ], 'Token refreshed successfully');
    }
}

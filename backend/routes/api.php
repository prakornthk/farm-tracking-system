<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FarmController;
use App\Http\Controllers\Api\LineNotifyController;
use App\Http\Controllers\Api\PlotController;
use App\Http\Controllers\Api\PlantController;
use App\Http\Controllers\Api\ProblemReportController;
use App\Http\Controllers\Api\QrController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\ZoneController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
});

// Public routes (no authentication required)
Route::prefix('auth')->group(function () {
    // LINE Login
    Route::post('/line/callback', [AuthController::class, 'lineCallback']);
    Route::post('/line/login', [AuthController::class, 'lineLogin']);
});

// QR Code scanning (public for quick lookup)
Route::post('/qr/scan', [QrController::class, 'scan']);

// Protected routes (authentication required)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });

    // Dashboard
    Route::prefix('dashboard')->group(function () {
        Route::get('/metrics', [DashboardController::class, 'metrics']);
        Route::get('/today', [DashboardController::class, 'todayStats']);
    });

    // Farms (nested under farms for clarity)
    Route::prefix('farms')->group(function () {
        Route::get('/', [FarmController::class, 'index']);
        Route::post('/', [FarmController::class, 'store']);
        Route::get('/{id}', [FarmController::class, 'show']);
        Route::put('/{id}', [FarmController::class, 'update']);
        Route::delete('/{id}', [FarmController::class, 'destroy']);
        Route::get('/{id}/with-relations', [FarmController::class, 'withRelations']);
        Route::get('/{id}/metrics', [FarmController::class, 'metrics']);
        Route::get('/{id}/users', [FarmController::class, 'users']);

        // Zones nested under farm
        Route::get('/{farmId}/zones', [ZoneController::class, 'index']);
        Route::post('/{farmId}/zones', [ZoneController::class, 'store']);
        Route::get('/{farmId}/zones/{zoneId}', [ZoneController::class, 'show']);
        Route::put('/{farmId}/zones/{zoneId}', [ZoneController::class, 'update']);
        Route::delete('/{farmId}/zones/{zoneId}', [ZoneController::class, 'destroy']);

        // Problem reports nested under farm
        Route::get('/{farmId}/problem-reports', [ProblemReportController::class, 'byFarm']);
    });

    // Zones (direct access with zone ID)
    Route::prefix('zones')->group(function () {
        Route::get('/{id}', [ZoneController::class, 'show']);
        Route::put('/{id}', [ZoneController::class, 'update']);
        Route::delete('/{id}', [ZoneController::class, 'destroy']);

        // Plots nested under zone
        Route::get('/{zoneId}/plots', [PlotController::class, 'index']);
        Route::post('/{zoneId}/plots', [PlotController::class, 'store']);
        Route::get('/{zoneId}/plots/{plotId}', [PlotController::class, 'show']);
        Route::put('/{zoneId}/plots/{plotId}', [PlotController::class, 'update']);
        Route::delete('/{zoneId}/plots/{plotId}', [PlotController::class, 'destroy']);
    });

    // Plots (direct access)
    Route::prefix('plots')->group(function () {
        Route::get('/{id}', [PlotController::class, 'show']);
        Route::put('/{id}', [PlotController::class, 'update']);
        Route::delete('/{id}', [PlotController::class, 'destroy']);

        // Plants nested under plot
        Route::get('/{plotId}/plants', [PlantController::class, 'index']);
        Route::post('/{plotId}/plants', [PlantController::class, 'store']);
        Route::get('/{plotId}/plants/{plantId}', [PlantController::class, 'show']);
        Route::put('/{plotId}/plants/{plantId}', [PlantController::class, 'update']);
        Route::delete('/{plotId}/plants/{plantId}', [PlantController::class, 'destroy']);

        // Activities for plot
        Route::get('/{plotId}/activities', [ActivityController::class, 'byTarget']);
    });

    // Plants (direct access)
    Route::prefix('plants')->group(function () {
        Route::get('/{id}', [PlantController::class, 'show']);
        Route::put('/{id}', [PlantController::class, 'update']);
        Route::delete('/{id}', [PlantController::class, 'destroy']);
        Route::post('/find-by-qr', [PlantController::class, 'findByQrCode']);

        // Activities for plant
        Route::get('/{plantId}/activities', [ActivityController::class, 'byTarget']);
    });

    // Activities
    Route::prefix('activities')->group(function () {
        Route::get('/', [ActivityController::class, 'index']);
        Route::post('/', [ActivityController::class, 'store']);
        Route::post('/batch', [ActivityController::class, 'storeBatch']);
        Route::get('/{id}', [ActivityController::class, 'show']);
    });

    // Tasks
    Route::prefix('tasks')->group(function () {
        Route::get('/', [TaskController::class, 'index']);
        Route::post('/', [TaskController::class, 'store']);
        Route::get('/my', [TaskController::class, 'myTasks']);
        Route::get('/{id}', [TaskController::class, 'show']);
        Route::put('/{id}', [TaskController::class, 'update']);
        Route::delete('/{id}', [TaskController::class, 'destroy']);
        Route::put('/{taskId}/assignment-status', [TaskController::class, 'updateAssignmentStatus']);
    });

    // Problem Reports
    Route::prefix('problem-reports')->group(function () {
        Route::get('/', [ProblemReportController::class, 'index']);
        Route::post('/', [ProblemReportController::class, 'store']);
        Route::get('/{id}', [ProblemReportController::class, 'show']);
        Route::put('/{id}', [ProblemReportController::class, 'update']);
        Route::delete('/{id}', [ProblemReportController::class, 'destroy']);
    });

    // QR Codes
    Route::prefix('qr')->group(function () {
        Route::get('/plot/{id}', [QrController::class, 'plot']);
        Route::get('/plant/{id}', [QrController::class, 'plant']);
        Route::get('/as-image', [QrController::class, 'asImage']);
    });

    // LINE Notify
    Route::prefix('line-notify')->group(function () {
        Route::post('/send', [LineNotifyController::class, 'send']);
        Route::post('/send-with-image', [LineNotifyController::class, 'sendWithImage']);
        Route::post('/send-task', [LineNotifyController::class, 'sendTaskNotification']);
        Route::post('/send-problem', [LineNotifyController::class, 'sendProblemNotification']);
    });
});

// Role-based routes (owner, manager only)
Route::middleware(['auth:sanctum', 'role:owner,manager'])->group(function () {
    // Admin operations can be added here
});

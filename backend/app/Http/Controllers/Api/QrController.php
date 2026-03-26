<?php

namespace App\Http\Controllers\Api;

use App\Models\Plot;
use App\Models\Plant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QrController extends ApiController
{
    /**
     * Generate QR code for a plot.
     */
    public function plot(int $id): JsonResponse
    {
        $plot = Plot::with(['zone.farm'])->findOrFail($id);

        $qrData = json_encode([
            'type' => 'plot',
            'farm_id' => $plot->zone->farm_id,
            'farm_name' => $plot->zone->farm->name,
            'zone_id' => $plot->zone_id,
            'zone_name' => $plot->zone->name,
            'plot_id' => $plot->id,
            'plot_name' => $plot->name,
        ]);

        $qrCode = QrCode::size(300)->margin(10)->generate($qrData);

        // Save QR code to storage
        $filename = "qr/plot_{$plot->id}_" . time() . '.svg';
        \Storage::disk('public')->put($filename, $qrCode);

        // Update plot's qr_code field
        $plot->update(['qr_code' => $filename, 'qr_code_data' => $qrData]);

        return $this->success([
            'qr_code' => $filename,
            'qr_code_url' => \Storage::url($filename),
            'qr_data' => $qrData,
            'plot' => [
                'id' => $plot->id,
                'name' => $plot->name,
                'zone' => $plot->zone->name,
                'farm' => $plot->zone->farm->name,
            ],
        ], 'QR code generated successfully');
    }

    /**
     * Generate QR code for a plant.
     */
    public function plant(int $id): JsonResponse
    {
        $plant = Plant::with(['plot.zone.farm'])->findOrFail($id);

        $qrData = json_encode([
            'type' => 'plant',
            'farm_id' => $plant->plot->zone->farm_id,
            'farm_name' => $plant->plot->zone->farm->name,
            'zone_id' => $plant->plot->zone_id,
            'zone_name' => $plant->plot->zone->name,
            'plot_id' => $plant->plot_id,
            'plot_name' => $plant->plot->name,
            'plant_id' => $plant->id,
            'plant_name' => $plant->name,
        ]);

        $qrCode = QrCode::size(300)->margin(10)->generate($qrData);

        // Save QR code to storage
        $filename = "qr/plant_{$plant->id}_" . time() . '.svg';
        \Storage::disk('public')->put($filename, $qrCode);

        // Update plant's qr_code field
        $plant->update(['qr_code' => $filename, 'qr_code_data' => $qrData]);

        return $this->success([
            'qr_code' => $filename,
            'qr_code_url' => \Storage::url($filename),
            'qr_data' => $qrData,
            'plant' => [
                'id' => $plant->id,
                'name' => $plant->name,
                'variety' => $plant->variety,
                'plot' => $plant->plot->name,
                'zone' => $plant->plot->zone->name,
                'farm' => $plant->plot->zone->farm->name,
            ],
        ], 'QR code generated successfully');
    }

    /**
     * Generate QR code and return as base64 image.
     */
    public function asImage(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:plot,plant',
            'id' => 'required|integer',
        ]);

        $type = $request->input('type');
        $id = $request->input('id');

        if ($type === 'plot') {
            $model = Plot::with(['zone.farm'])->findOrFail($id);
            $qrData = json_encode([
                'type' => 'plot',
                'farm_id' => $model->zone->farm_id,
                'zone_id' => $model->zone_id,
                'plot_id' => $model->id,
            ]);
        } else {
            $model = Plant::with(['plot.zone.farm'])->findOrFail($id);
            $qrData = json_encode([
                'type' => 'plant',
                'farm_id' => $model->plot->zone->farm_id,
                'zone_id' => $model->plot->zone_id,
                'plot_id' => $model->plot_id,
                'plant_id' => $model->id,
            ]);
        }

        $size = $request->input('size', 300);
        $margin = $request->input('margin', 10);

        $qrCode = QrCode::size($size)->margin($margin)->generate($qrData);

        // Convert to base64
        $base64 = base64_encode($qrCode);
        $dataUri = "data:image/svg+xml;base64,{$base64}";

        return $this->success([
            'qr_code' => $dataUri,
            'qr_data' => $qrData,
        ], 'QR code generated successfully');
    }

    /**
     * Scan QR code and return entity info.
     */
    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'qr_data' => 'required|string',
        ]);

        $qrData = json_decode($request->input('qr_data'), true);

        if (!$qrData || !isset($qrData['type'])) {
            return $this->error('Invalid QR code data', 400);
        }

        $type = $qrData['type'];
        $user = $request->user();

        // Helper to verify farm access
        $verifyFarmAccess = function (int $farmId) use ($user): bool {
            if ($user->role === 'super_admin') return true;
            return \App\Models\Farm::where('id', $farmId)
                ->whereHas('users', fn($q) => $q->where('users.id', $user->id))
                ->exists();
        };

        if ($type === 'plot') {
            if (!isset($qrData['plot_id'])) {
                return $this->error('Missing plot_id in QR data', 400);
            }
            $plot = Plot::with(['zone.farm', 'plants'])->find($qrData['plot_id']);
            if (!$plot) {
                return $this->error('Plot not found', 404);
            }
            if (!$verifyFarmAccess($plot->zone->farm_id)) {
                return $this->error('Forbidden: You do not have access to this farm', 403);
            }
            return $this->success([
                'type' => 'plot',
                'entity' => $plot,
                'plants_count' => $plot->plants()->count(),
            ], 'Plot found');
        }

        if ($type === 'plant') {
            if (!isset($qrData['plant_id'])) {
                return $this->error('Missing plant_id in QR data', 400);
            }
            $plant = Plant::with(['plot.zone.farm'])->find($qrData['plant_id']);
            if (!$plant) {
                return $this->error('Plant not found', 404);
            }
            if (!$verifyFarmAccess($plant->plot->zone->farm_id)) {
                return $this->error('Forbidden: You do not have access to this farm', 403);
            }
            return $this->success([
                'type' => 'plant',
                'entity' => $plant,
                'plot' => $plant->plot,
                'zone' => $plant->plot->zone,
                'farm' => $plant->plot->zone->farm,
            ], 'Plant found');
        }

        return $this->error('Unknown QR code type', 400);
    }
}

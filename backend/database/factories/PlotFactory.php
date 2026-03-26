<?php

namespace Database\Factories;

use App\Models\Plot;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlotFactory extends Factory
{
    protected $model = Plot::class;

    public function definition(): array
    {
        return [
            'zone_id' => Zone::factory(),
            'name' => fake()->word() . ' Plot',
            'description' => fake()->sentence(),
            'size' => fake()->randomFloat(2, 100, 10000),
            'size_unit' => 'sqm',
            'qr_code' => null,
            'qr_code_data' => null,
            'status' => 'active',
            'sort_order' => fake()->numberBetween(1, 100),
            'is_active' => true,
            'code' => null,
            'crop_type' => null,
            'total_plants' => 0,
            'area' => null,
            'image_url' => null,
            'note' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    public function harvested(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'harvested',
        ]);
    }
}

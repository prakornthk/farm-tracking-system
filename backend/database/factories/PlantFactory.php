<?php

namespace Database\Factories;

use App\Models\Plant;
use App\Models\Plot;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlantFactory extends Factory
{
    protected $model = Plant::class;

    public function definition(): array
    {
        return [
            'plot_id' => Plot::factory(),
            'name' => fake()->word() . ' Plant',
            'variety' => fake()->word(),
            'planted_date' => now()->subDays(fake()->numberBetween(1, 30)),
            'expected_harvest_date' => now()->addDays(fake()->numberBetween(30, 120)),
            'status' => 'vegetative',
            'quantity' => fake()->numberBetween(1, 100),
            'notes' => fake()->sentence(),
            'qr_code' => null,
            'qr_code_data' => null,
        ];
    }

    public function seedling(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'seedling',
        ]);
    }

    public function fruiting(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'fruiting',
        ]);
    }

    public function harvested(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'harvested',
        ]);
    }
}

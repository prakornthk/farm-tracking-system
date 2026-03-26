<?php

namespace Database\Factories;

use App\Models\Activity;
use App\Models\Farm;
use App\Models\Plant;
use App\Models\Plot;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

class ActivityFactory extends Factory
{
    protected $model = Activity::class;

    public function definition(): array
    {
        // Create a minimal hierarchy for the activity
        $farm = Farm::factory()->create();
        $zone = Zone::factory()->create(['farm_id' => $farm->id]);
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);

        return [
            'farm_id' => $farm->id,
            'user_id' => User::factory()->create()->id,
            'activitable_type' => Plot::class,
            'activitable_id' => $plot->id,
            'type' => 'watering',
            'description' => fake()->sentence(),
            'quantity' => fake()->randomFloat(2, 1, 100),
            'quantity_unit' => 'liter',
            'yield_amount' => null,
            'yield_unit' => null,
            'yield_price_per_unit' => null,
            'yield_total_value' => null,
            'metadata' => null,
            'activity_date' => now(),
        ];
    }

    public function harvesting(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'harvesting',
            'yield_amount' => fake()->randomFloat(2, 10, 500),
            'yield_unit' => 'kg',
            'yield_price_per_unit' => fake()->randomFloat(2, 10, 100),
            'yield_total_value' => fake()->randomFloat(2, 100, 50000),
        ]);
    }
}

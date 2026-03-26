<?php

namespace Database\Factories;

use App\Models\Farm;
use App\Models\ProblemReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProblemReportFactory extends Factory
{
    protected $model = ProblemReport::class;

    public function definition(): array
    {
        return [
            'farm_id' => Farm::factory(),
            'reporter_id' => User::factory(),
            'plot_id' => null,
            'plant_id' => null,
            'type' => 'disease',
            'severity' => 'medium',
            'status' => 'reported',
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(2),
            'symptoms' => fake()->paragraph(),
            'suspected_cause' => fake()->sentence(),
            'resolution' => null,
            'image_url' => null,
            'metadata' => null,
            'resolved_at' => null,
        ];
    }

    public function critical(): static
    {
        return $this->state(fn (array $attributes) => [
            'severity' => 'critical',
        ]);
    }

    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'resolved',
            'resolution' => fake()->sentence(),
            'resolved_at' => now(),
        ]);
    }

    public function investigating(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'investigating',
        ]);
    }
}

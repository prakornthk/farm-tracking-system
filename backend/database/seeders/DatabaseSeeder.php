<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Farm;
use App\Models\Plant;
use App\Models\Plot;
use App\Models\ProblemReport;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create super admin
        $superAdmin = User::create([
            'name' => 'admin',
            'email' => 'admin@farm.local',
            'password' => Hash::make('11223344'),
            'role' => 'super_admin',
        ]);

        // Create owner
        $owner = User::create([
            'name' => 'owner',
            'email' => 'owner@farm.local',
            'password' => Hash::make('11223344'),
            'role' => 'owner',
        ]);

        // Create manager
        $manager = User::create([
            'name' => 'manager',
            'email' => 'manager@farm.local',
            'password' => Hash::make('11223344'),
            'role' => 'manager',
        ]);

        // Create workers
        $worker1 = User::create([
            'name' => 'worker1',
            'email' => 'worker1@farm.local',
            'password' => Hash::make('11223344'),
            'role' => 'worker',
        ]);

        $worker2 = User::create([
            'name' => 'worker2',
            'email' => 'worker2@farm.local',
            'password' => Hash::make('11223344'),
            'role' => 'worker',
        ]);

        // Create demo farm
        $farm = Farm::create([
            'name' => 'Demo Farm',
            'description' => 'A demonstration farm for testing',
            'location' => 'Bangkok, Thailand',
            'latitude' => 13.7563,
            'longitude' => 100.5018,
            'is_active' => true,
        ]);

        // Attach users to farm
        $farm->users()->attach($owner->id, ['role' => 'owner']);
        $farm->users()->attach($manager->id, ['role' => 'manager']);
        $farm->users()->attach($worker1->id, ['role' => 'worker']);
        $farm->users()->attach($worker2->id, ['role' => 'worker']);

        // Create zones
        $zone1 = Zone::create([
            'farm_id' => $farm->id,
            'name' => 'Zone A - Vegetables',
            'description' => 'Vegetable growing area',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $zone2 = Zone::create([
            'farm_id' => $farm->id,
            'name' => 'Zone B - Fruits',
            'description' => 'Fruit trees area',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        // Create plots for Zone A
        $plot1 = Plot::create([
            'zone_id' => $zone1->id,
            'name' => 'Plot A1 - Tomatoes',
            'description' => 'Tomato growing plot',
            'size' => 100,
            'size_unit' => 'sqm',
            'status' => 'planted',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $plot2 = Plot::create([
            'zone_id' => $zone1->id,
            'name' => 'Plot A2 - Lettuce',
            'description' => 'Lettuce growing plot',
            'size' => 50,
            'size_unit' => 'sqm',
            'status' => 'growing',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        // Create plots for Zone B
        $plot3 = Plot::create([
            'zone_id' => $zone2->id,
            'name' => 'Plot B1 - Mangoes',
            'description' => 'Mango tree plot',
            'size' => 500,
            'size_unit' => 'sqm',
            'status' => 'planted',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        // Create plants for Plot A1
        $plant1 = Plant::create([
            'plot_id' => $plot1->id,
            'name' => 'Roma Tomato',
            'variety' => 'Roma VF',
            'planted_date' => now()->subDays(30),
            'expected_harvest_date' => now()->addDays(60),
            'status' => 'vegetative',
            'quantity' => 50,
        ]);

        $plant2 = Plant::create([
            'plot_id' => $plot1->id,
            'name' => 'Cherry Tomato',
            'variety' => 'Sweet Cherry',
            'planted_date' => now()->subDays(45),
            'expected_harvest_date' => now()->addDays(45),
            'status' => 'flowering',
            'quantity' => 30,
        ]);

        // Create plants for Plot A2
        $plant3 = Plant::create([
            'plot_id' => $plot2->id,
            'name' => 'Butterhead Lettuce',
            'variety' => 'Buttercrunch',
            'planted_date' => now()->subDays(20),
            'expected_harvest_date' => now()->addDays(25),
            'status' => 'growing',
            'quantity' => 100,
        ]);

        // Create plants for Plot B1
        $plant4 = Plant::create([
            'plot_id' => $plot3->id,
            'name' => 'Nam Doc Mai Mango',
            'variety' => 'Nam Doc Mai',
            'planted_date' => now()->subYears(3),
            'expected_harvest_date' => now()->addMonths(2),
            'status' => 'vegetative',
            'quantity' => 10,
        ]);

        // Create activities
        Activity::create([
            'user_id' => $worker1->id,
            'farm_id' => $farm->id,
            'activitable_type' => Plot::class,
            'activitable_id' => $plot1->id,
            'type' => 'watering',
            'description' => 'Morning watering for tomatoes',
            'quantity' => 20,
            'quantity_unit' => 'liters',
            'activity_date' => now()->subDays(1),
        ]);

        Activity::create([
            'user_id' => $manager->id,
            'farm_id' => $farm->id,
            'activitable_type' => Plot::class,
            'activitable_id' => $plot1->id,
            'type' => 'fertilizing',
            'description' => 'Applied NPK fertilizer',
            'quantity' => 5,
            'quantity_unit' => 'kg',
            'activity_date' => now()->subDays(3),
        ]);

        Activity::create([
            'user_id' => $worker2->id,
            'farm_id' => $farm->id,
            'activitable_type' => Plant::class,
            'activitable_id' => $plant1->id,
            'type' => 'harvesting',
            'description' => 'First harvest of Roma tomatoes',
            'yield_amount' => 25,
            'yield_unit' => 'kg',
            'yield_price_per_unit' => 30,
            'yield_total_value' => 750,
            'activity_date' => now()->subDays(5),
        ]);

        Activity::create([
            'user_id' => $worker1->id,
            'farm_id' => $farm->id,
            'activitable_type' => Plot::class,
            'activitable_id' => $plot2->id,
            'type' => 'inspection',
            'description' => 'Regular inspection - plants look healthy',
            'activity_date' => now()->subHours(6),
        ]);

        // Create tasks
        $task1 = Task::create([
            'farm_id' => $farm->id,
            'created_by' => $manager->id,
            'title' => 'Water all vegetable plots',
            'description' => 'Morning watering routine for all plots in Zone A',
            'type' => 'activity',
            'priority' => 'high',
            'status' => 'pending',
            'due_date' => now()->addDays(1),
            'zone_id' => $zone1->id,
        ]);

        $task2 = Task::create([
            'farm_id' => $farm->id,
            'created_by' => $owner->id,
            'title' => 'Apply pesticide to tomatoes',
            'description' => 'Spray organic pesticide on Roma and Cherry tomatoes',
            'type' => 'maintenance',
            'priority' => 'medium',
            'status' => 'in_progress',
            'due_date' => now()->addDays(2),
            'plot_id' => $plot1->id,
        ]);

        $task3 = Task::create([
            'farm_id' => $farm->id,
            'created_by' => $manager->id,
            'title' => 'Harvest lettuce batch',
            'description' => 'Harvest 50 heads of butterhead lettuce',
            'type' => 'harvest',
            'priority' => 'urgent',
            'status' => 'pending',
            'due_date' => now(),
            'plot_id' => $plot2->id,
        ]);

        // Create task assignments
        TaskAssignment::create([
            'task_id' => $task1->id,
            'user_id' => $worker1->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        TaskAssignment::create([
            'task_id' => $task1->id,
            'user_id' => $worker2->id,
            'status' => 'accepted',
            'assigned_at' => now(),
            'accepted_at' => now(),
        ]);

        TaskAssignment::create([
            'task_id' => $task2->id,
            'user_id' => $worker1->id,
            'status' => 'in_progress',
            'assigned_at' => now(),
        ]);

        TaskAssignment::create([
            'task_id' => $task3->id,
            'user_id' => $worker2->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        // Create problem reports
        ProblemReport::create([
            'farm_id' => $farm->id,
            'reporter_id' => $worker1->id,
            'plot_id' => $plot1->id,
            'plant_id' => $plant2->id,
            'severity' => 'medium',
            'status' => 'investigating',
            'title' => 'Yellow leaves on Cherry Tomato',
            'description' => 'Some leaves showing yellow discoloration',
            'symptoms' => 'Yellow spots on lower leaves, some leaf curl',
            'suspected_cause' => 'Possible nitrogen deficiency',
        ]);

        ProblemReport::create([
            'farm_id' => $farm->id,
            'reporter_id' => $manager->id,
            'severity' => 'low',
            'status' => 'resolved',
            'title' => 'Minor pest presence in Zone A',
            'description' => 'Small aphid colony found near lettuce area',
            'resolution' => 'Removed manually and applied neem oil spray',
            'resolved_at' => now()->subDays(2),
        ]);

        echo "Database seeded successfully!\n";
        echo "Demo credentials:\n";
        echo "  Admin: admin@farm.local / 11223344\n";
        echo "  Owner: owner@farm.local / 11223344\n";
        echo "  Manager: manager@farm.local / 11223344\n";
        echo "  Worker: worker1@farm.local / 11223344\n";
    }
}

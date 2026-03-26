<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Interfaces\FarmRepositoryInterface;
use App\Repositories\FarmRepository;
use App\Repositories\Interfaces\ZoneRepositoryInterface;
use App\Repositories\ZoneRepository;
use App\Repositories\Interfaces\PlotRepositoryInterface;
use App\Repositories\PlotRepository;
use App\Repositories\Interfaces\PlantRepositoryInterface;
use App\Repositories\PlantRepository;
use App\Repositories\Interfaces\ActivityRepositoryInterface;
use App\Repositories\ActivityRepository;
use App\Repositories\Interfaces\TaskRepositoryInterface;
use App\Repositories\TaskRepository;
use App\Repositories\Interfaces\ProblemReportRepositoryInterface;
use App\Repositories\ProblemReportRepository;
use App\Repositories\Interfaces\UserRepositoryInterface;
use App\Repositories\UserRepository;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Repository Bindings
        $this->app->bind(FarmRepositoryInterface::class, FarmRepository::class);
        $this->app->bind(ZoneRepositoryInterface::class, ZoneRepository::class);
        $this->app->bind(PlotRepositoryInterface::class, PlotRepository::class);
        $this->app->bind(PlantRepositoryInterface::class, PlantRepository::class);
        $this->app->bind(ActivityRepositoryInterface::class, ActivityRepository::class);
        $this->app->bind(TaskRepositoryInterface::class, TaskRepository::class);
        $this->app->bind(ProblemReportRepositoryInterface::class, ProblemReportRepository::class);
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}

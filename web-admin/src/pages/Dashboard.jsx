import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Map, ClipboardList, CheckCircle2, AlertTriangle, ArrowRight, Wheat, TrendingUp } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { dashboardAPI } from '../services/api';
import { LoadingSpinner, ErrorAlert } from '../components/Shared';

function StatCardSkeleton() {
  return (
    <div className="card-padded animate-pulse" aria-hidden="true">
      <div className="inline-flex p-2 rounded-lg mb-3 bg-gray-100 w-9 h-9" />
      <div className="h-8 bg-gray-100 rounded w-16 mb-1.5" />
      <div className="h-3.5 bg-gray-100 rounded w-20" />
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, execute } = useApi(() => dashboardAPI.metrics());

  useEffect(() => { execute(); }, []);

  const metrics = data || {
    total_plants: 0,
    plant_status_breakdown: {},
    total_plots: 0,
    today_tasks: 0,
    completed_tasks_today: 0,
    total_yield: 0,
    yield_by_plot: [],
    problems: { open: 0 },
    tasks: { pending: 0 },
  };

  // Format plant status breakdown for display
  const plantStatusLabels = {
    planted: 'ปลูกแล้ว',
    growing: 'กำลังเติบโต',
    ready_to_harvest: 'พร้อมเก็บเกี่ยว',
    harvested: 'เก็บเกี่ยวแล้ว',
    dead: 'ตายแล้ว',
  };

  const plantStatusColors = {
    planted: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    growing: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    ready_to_harvest: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
    harvested: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
    dead: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  };

  // Derived counts for badge emphasis
  const plantCounts = Object.entries(metrics.plant_status_breakdown || {});
  const maxPlantCount = plantCounts.length > 0 ? Math.max(...plantCounts.map(([, c]) => c)) : 0;

  if (loading) return (
    <div>
      <h1 className="page-title mb-1">แดชบอร์ด</h1>
      <p className="text-sm text-gray-500 mb-6">กำลังโหลดข้อมูล...</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        {[...Array(7)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      {/* Section skeletons */}
      <div className="space-y-6">
        <div className="card-padded animate-pulse">
          <div className="h-5 bg-gray-100 rounded w-32 mb-4" />
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-7 bg-gray-100 rounded-full w-20" />
            ))}
          </div>
        </div>
        <div className="card-padded animate-pulse">
          <div className="h-5 bg-gray-100 rounded w-40 mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-100 rounded w-24" />
                <div className="h-4 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return <ErrorAlert message={error} onRetry={execute} />;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="page-title mb-0.5">แดชบอร์ด</h1>
        <p className="text-sm text-gray-600">
          ภาพรวมฟาร์มและการดำเนินงาน
        </p>
      </div>

      {/* Main Stats Cards - 7 metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-8">
        {/* 1. Total Plants */}
        <Link to="/farms" className="card-padded card-hover group">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-green-50 ring-1 ring-green-100">
            <Sprout size={18} className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 leading-none tracking-tight">
            {metrics.total_plants ?? 0}
          </p>
          <p className="text-sm text-gray-600 mt-1.5 font-medium">ต้นไม้ทั้งหมด</p>
        </Link>

        {/* 2. Total Plots */}
        <Link to="/farms" className="card-padded card-hover group">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-blue-50 ring-1 ring-blue-100">
            <Map size={18} className="text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 leading-none tracking-tight">
            {metrics.total_plots ?? 0}
          </p>
          <p className="text-sm text-gray-600 mt-1.5 font-medium">แปลงทั้งหมด</p>
        </Link>

        {/* 3. Today Tasks */}
        <Link to="/tasks" className="card-padded card-hover group">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-orange-50 ring-1 ring-orange-100">
            <ClipboardList size={18} className="text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 leading-none tracking-tight">
            {metrics.today_tasks ?? 0}
          </p>
          <p className="text-sm text-gray-600 mt-1.5 font-medium">งานวันนี้</p>
        </Link>

        {/* 4. Completed Tasks Today */}
        <Link to="/tasks" className="card-padded card-hover group">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-green-100 ring-1 ring-green-200">
            <CheckCircle2 size={18} className="text-green-700" />
          </div>
          <p className="text-3xl font-bold text-gray-900 leading-none tracking-tight">
            {metrics.completed_tasks_today ?? 0}
          </p>
          <p className="text-sm text-gray-600 mt-1.5 font-medium">งานเสร็จวันนี้</p>
        </Link>

        {/* 5. Total Yield */}
        <Link to="/farms" className="card-padded card-hover group">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-amber-50 ring-1 ring-amber-100">
            <Wheat size={18} className="text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 leading-none tracking-tight">
            {(metrics.total_yield ?? 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1.5 font-medium">ผลผลิตรวม (kg)</p>
        </Link>

        {/* 6. Open Problems — critical, visually emphasized */}
        <Link to="/problems" className="card-padded card-hover group ring-2 ring-red-200 bg-red-50/40">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-red-100 ring-1 ring-red-200">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-700 leading-none tracking-tight">
            {metrics.problems?.open ?? 0}
          </p>
          <p className="text-sm text-red-600 mt-1.5 font-semibold">ปัญหาเปิด</p>
        </Link>

        {/* 7. Pending Tasks */}
        <Link to="/tasks" className="card-padded card-hover group">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-yellow-50 ring-1 ring-yellow-100">
            <TrendingUp size={18} className="text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 leading-none tracking-tight">
            {metrics.tasks?.pending ?? 0}
          </p>
          <p className="text-sm text-gray-600 mt-1.5 font-medium">งานค้าง</p>
        </Link>
      </div>

      {/* Plant Status Breakdown */}
      {metrics.plant_status_breakdown && Object.keys(metrics.plant_status_breakdown).length > 0 && (
        <div className="card-padded mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-gray-900">สถานะต้นไม้</h2>
            <span className="text-xs text-gray-400 font-normal">
              {Object.values(metrics.plant_status_breakdown).reduce((a, b) => a + b, 0)} ต้น
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {plantCounts.map(([status, count]) => {
              const isDominant = count === maxPlantCount && maxPlantCount > 0;
              return (
                <div
                  key={status}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${plantStatusColors[status] || 'bg-gray-50 text-gray-600 ring-1 ring-gray-200'}`}
                >
                  <span className={`font-bold ${isDominant ? 'text-base' : 'font-medium'}`}>{count}</span>
                  <span>{plantStatusLabels[status] || status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Yield by Plot */}
      {metrics.yield_by_plot && metrics.yield_by_plot.length > 0 && (
        <div className="card-padded mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">ผลผลิตตามแปลง</h2>
            <span className="text-xs text-gray-400">
              {metrics.yield_by_plot.length} แปลง
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">แปลง</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">ผลผลิต (kg)</th>
                </tr>
              </thead>
              <tbody>
                {metrics.yield_by_plot.map((item, idx) => (
                  <tr
                    key={item.plot_id}
                    className={`border-b border-gray-50 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                  >
                    <td className="py-2.5 px-4 text-gray-800 font-medium">{item.plot_name}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-amber-700">
                      {(item.total_yield ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/tasks" className="card-padded card-hover flex items-center gap-3 group">
          <span className="p-2 bg-orange-50 rounded-lg"><ClipboardList className="text-orange-500" size={18} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">งานทั้งหมด</p>
            <p className="text-xs text-gray-400 mt-0.5">ดูและจัดการงาน</p>
          </div>
          <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
        </Link>
        <Link to="/problems" className="card-padded card-hover flex items-center gap-3 group">
          <span className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="text-red-500" size={18} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">ปัญหา</p>
            <p className="text-xs text-gray-400 mt-0.5">รายงานปัญหาที่พบ</p>
          </div>
          <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
        </Link>
        <Link to="/farms" className="card-padded card-hover flex items-center gap-3 group">
          <span className="p-2 bg-green-50 rounded-lg"><Map className="text-green-600" size={18} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">ฟาร์ม</p>
            <p className="text-xs text-gray-400 mt-0.5">จัดการฟาร์มและโซน</p>
          </div>
          <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
}

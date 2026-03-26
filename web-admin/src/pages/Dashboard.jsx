import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Map, ClipboardList, CheckCircle2, AlertTriangle, ArrowRight, Wheat, TrendingUp } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { dashboardAPI } from '../services/api';
import { LoadingSpinner, ErrorAlert } from '../components/Shared';

function StatCardSkeleton() {
  return (
    <div className="card-padded animate-pulse">
      <div className="inline-flex p-2 rounded-lg mb-3 bg-gray-100 w-9 h-9" />
      <div className="h-8 bg-gray-100 rounded w-16 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-24" />
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
    planted: 'bg-blue-50 text-blue-600',
    growing: 'bg-green-50 text-green-600',
    ready_to_harvest: 'bg-yellow-50 text-yellow-600',
    harvested: 'bg-purple-50 text-purple-600',
    dead: 'bg-red-50 text-red-600',
  };

  if (loading) return (
    <div>
      <h1 className="page-title mb-6">แดชบอร์ด</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[...Array(7)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
    </div>
  );

  if (error) return <ErrorAlert message={error} onRetry={execute} />;

  return (
    <div>
      <h1 className="page-title mb-6">แดชบอร์ด</h1>

      {/* Main Stats Cards - 7 metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        {/* 1. Total Plants */}
        <Link to="/farms" className="card-padded card-hover group">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-green-50">
            <Sprout size={18} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none">
            {metrics.total_plants ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1.5">ต้นไม้ทั้งหมด</p>
        </Link>

        {/* 2. Total Plots */}
        <Link to="/farms" className="card-padded card-hover group">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-blue-50">
            <Map size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none">
            {metrics.total_plots ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1.5">แปลงทั้งหมด</p>
        </Link>

        {/* 3. Today Tasks */}
        <Link to="/tasks" className="card-padded card-hover group">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-orange-50">
            <ClipboardList size={18} className="text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none">
            {metrics.today_tasks ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1.5">งานวันนี้</p>
        </Link>

        {/* 4. Completed Tasks Today */}
        <Link to="/tasks" className="card-padded card-hover group">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-green-100">
            <CheckCircle2 size={18} className="text-green-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none">
            {metrics.completed_tasks_today ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1.5">งานเสร็จวันนี้</p>
        </Link>

        {/* 5. Total Yield */}
        <Link to="/farms" className="card-padded card-hover group">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-amber-50">
            <Wheat size={18} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none">
            {(metrics.total_yield ?? 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1.5">ผลผลิตรวม (kg)</p>
        </Link>

        {/* 6. Open Problems */}
        <Link to="/problems" className="card-padded card-hover group">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-red-50">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none">
            {metrics.problems?.open ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1.5">ปัญหาเปิด</p>
        </Link>

        {/* 7. Pending Tasks */}
        <Link to="/tasks" className="card-padded card-hover group">
          <div className="inline-flex p-2 rounded-lg mb-3 bg-yellow-50">
            <TrendingUp size={18} className="text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-none">
            {metrics.tasks?.pending ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1.5">งานค้าง</p>
        </Link>
      </div>

      {/* Plant Status Breakdown */}
      {metrics.plant_status_breakdown && Object.keys(metrics.plant_status_breakdown).length > 0 && (
        <div className="card-padded mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">สถานะต้นไม้</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metrics.plant_status_breakdown).map(([status, count]) => (
              <div
                key={status}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${plantStatusColors[status] || 'bg-gray-50 text-gray-600'}`}
              >
                <span className="font-medium">{count}</span>
                <span>{plantStatusLabels[status] || status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yield by Plot */}
      {metrics.yield_by_plot && metrics.yield_by_plot.length > 0 && (
        <div className="card-padded mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">ผลผลิตตามแปลง</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">แปลง</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">ผลผลิต (kg)</th>
                </tr>
              </thead>
              <tbody>
                {metrics.yield_by_plot.map((item) => (
                  <tr key={item.plot_id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 px-3 text-gray-900">{item.plot_name}</td>
                    <td className="py-2 px-3 text-right font-medium text-amber-600">
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

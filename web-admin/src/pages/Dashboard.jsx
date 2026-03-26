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

      {/* Stats — asymmetric layout, breaking hero-metric template */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Primary: Plants overview — featured, larger */}
        <Link to="/farms" className="card-padded card-hover group lg:col-span-2 lg:flex lg:items-center lg:gap-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-green-50 ring-1 ring-green-100 flex items-center justify-center">
              <Sprout size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-5xl font-bold text-gray-900 leading-none tracking-tight">
                {metrics.total_plants ?? 0}
              </p>
              <p className="text-base font-medium text-gray-500 mt-1">ต้นไม้ทั้งหมด</p>
            </div>
          </div>
          <div className="mt-4 lg:mt-0 lg:ml-auto flex flex-wrap gap-6">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 leading-none">{metrics.total_plots ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">แปลง</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700 leading-none">{(metrics.total_yield ?? 0).toLocaleString()}<span className="text-sm font-medium ml-0.5">kg</span></p>
              <p className="text-xs text-gray-400 mt-0.5">ผลผลิตรวม</p>
            </div>
          </div>
        </Link>

        {/* Secondary: Today's tasks */}
        <Link to="/tasks" className="card-padded card-hover group">
          <div className="flex items-center gap-3 mb-3">
            <ClipboardList size={20} className="text-orange-500" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">งานวันนี้</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 leading-none tracking-tight">
            {metrics.today_tasks ?? 0}
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-sm font-medium text-green-700">{metrics.completed_tasks_today ?? 0} เสร็จ</span>
            <span className="text-xs text-gray-400">· {metrics.tasks?.pending ?? 0} ค้าง</span>
          </div>
        </Link>
      </div>

      {/* Problems row — only show when open > 0 */}
      {metrics.problems?.open > 0 && (
        <Link to="/problems" className="block card-padded mb-8 border-l-4 border-red-400 bg-red-50/50 hover:bg-red-50 transition-colors">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500" />
            <span className="text-sm font-semibold text-red-700">{metrics.problems?.open ?? 0} ปัญหาที่ยังเปิดอยู่</span>
            <span className="text-xs text-red-400 ml-auto">ดูรายละเอียด →</span>
          </div>
        </Link>
      )}

      {/* Plant Status Breakdown */}
      {metrics.plant_status_breakdown && Object.keys(metrics.plant_status_breakdown).length > 0 && (
        <div className="mb-8">
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
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">ลิงก์ด่วน</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/tasks" className="card-padded card-hover flex items-center gap-3 group">
            <span className="p-2 bg-orange-50 rounded-lg ring-1 ring-orange-100 flex-shrink-0"><ClipboardList className="text-orange-500" size={18} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">งานทั้งหมด</p>
              <p className="text-xs text-gray-600 mt-0.5">ดูและจัดการงาน</p>
            </div>
            <ArrowRight size={14} className="text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>
          <Link to="/problems" className="card-padded card-hover flex items-center gap-3 group">
            <span className="p-2 bg-red-50 rounded-lg ring-1 ring-red-100 flex-shrink-0"><AlertTriangle className="text-red-500" size={18} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">ปัญหา</p>
              <p className="text-xs text-gray-600 mt-0.5">รายงานปัญหาที่พบ</p>
            </div>
            <ArrowRight size={14} className="text-gray-400 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>
          <Link to="/farms" className="card-padded card-hover flex items-center gap-3 group">
            <span className="p-2 bg-green-50 rounded-lg ring-1 ring-green-100 flex-shrink-0"><Map className="text-green-600" size={18} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">ฟาร์ม</p>
              <p className="text-xs text-gray-600 mt-0.5">จัดการฟาร์มและโซน</p>
            </div>
            <ArrowRight size={14} className="text-gray-400 group-hover:text-green-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}

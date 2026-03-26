import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Map, ClipboardList, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
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
  const { data, loading, error, execute } = useApi(() => dashboardAPI.todayStats());

  useEffect(() => { execute(); }, []);

  const stats = data || {
    activities_today: 0, pending_tasks: 0, completed_tasks_today: 0,
    overdue_tasks: 0, open_problems: 0, my_tasks_today: 0,
  };

  const cards = [
    { label: 'กิจกรรมวันนี้', value: stats.activities_today, icon: Sprout,        bg: 'bg-green-50',   text: 'text-green-600', link: '/farms' },
    { label: 'งานค้าง',       value: stats.pending_tasks,    icon: ClipboardList, bg: 'bg-blue-50',    text: 'text-blue-600',  link: '/tasks' },
    { label: 'งานเสร็จวันนี้', value: stats.completed_tasks_today, icon: CheckCircle2, bg: 'bg-green-100', text: 'text-green-700', link: '/tasks' },
    { label: 'ปัญหาเปิด',     value: stats.open_problems,     icon: AlertTriangle, bg: 'bg-yellow-50', text: 'text-yellow-600',link: '/problems' },
  ];

  if (loading) return (
    <div>
      <h1 className="page-title mb-6">แดชบอร์ด</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card-padded animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  if (error) return <ErrorAlert message={error} onRetry={execute} />;

  return (
    <div>
      <h1 className="page-title mb-6">แดชบอร์ด</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="card-padded card-hover group">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${card.bg}`}>
              <card.icon size={18} className={card.text} />
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none">
              {stats.value !== undefined ? card.value : '—'}
            </p>
            <p className="text-sm text-gray-500 mt-1.5">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Overdue alert */}
      {stats.overdue_tasks > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-700">งานที่เกินกำหนด</p>
            <p className="text-xs text-red-500 mt-0.5">{stats.overdue_tasks} งานที่ต้องดำเนินการด่วน</p>
          </div>
        </div>
      )}

      {/* Quick links */}
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

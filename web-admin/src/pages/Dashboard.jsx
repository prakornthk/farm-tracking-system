import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Map, ClipboardList, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { dashboardAPI } from '../services/api';
import { LoadingSpinner, ErrorAlert } from '../components/Shared';

export default function Dashboard() {
  const { data, loading, error, execute } = useApi(() => dashboardAPI.todayStats());

  useEffect(() => {
    execute();
  }, []);

  const stats = data || {
    activities_today: 0,
    pending_tasks: 0,
    completed_tasks_today: 0,
    overdue_tasks: 0,
    open_problems: 0,
    my_tasks_today: 0,
  };

  const cards = [
    {
      label: 'กิจกรรมวันนี้',
      value: stats.activities_today,
      icon: Sprout,
      bg: 'bg-primary-50',
      text: 'text-primary-600',
      link: '/farms',
    },
    {
      label: 'งานค้าง',
      value: stats.pending_tasks,
      icon: ClipboardList,
      bg: 'bg-info-light',
      text: 'text-info',
      link: '/tasks',
    },
    {
      label: 'งานเสร็จวันนี้',
      value: stats.completed_tasks_today,
      icon: CheckCircle2,
      bg: 'bg-success-light',
      text: 'text-success',
      link: '/tasks',
    },
    {
      label: 'ปัญหาเปิด',
      value: stats.open_problems,
      icon: AlertTriangle,
      bg: 'bg-warning-light',
      text: 'text-warning',
      link: '/problems',
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={execute} />;

  return (
    <div>
      <h1 className="page-title mb-6">แดชบอร์ด</h1>

      {/* Stats cards — consistent 2-col grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="card-padded card-hover group">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${card.bg}`}>
              <card.icon size={18} className={card.text} />
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{stats.value !== undefined ? card.value : '—'}</p>
            <p className="text-sm text-gray-500 mt-1.5">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Overdue Tasks Alert */}
      {stats.overdue_tasks > 0 && (
        <div className="mb-6 p-4 bg-danger-light border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="text-danger flex-shrink-0" size={18} />
          <div>
            <p className="text-sm font-semibold text-danger-dark">งานที่เกินกำหนด</p>
            <p className="text-xs text-danger-dark/70 mt-0.5">{stats.overdue_tasks} งานที่ต้องดำเนินการด่วน</p>
          </div>
        </div>
      )}

      {/* Quick links — consistent with cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/tasks" className="card-padded card-hover flex items-center gap-3 group">
          <span className="p-2 bg-orange-50 rounded-lg">
            <ClipboardList className="text-orange-500" size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">งานทั้งหมด</p>
            <p className="text-xs text-gray-400 mt-0.5">ดูและจัดการงาน</p>
          </div>
          <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
        </Link>
        <Link to="/problems" className="card-padded card-hover flex items-center gap-3 group">
          <span className="p-2 bg-danger-light rounded-lg">
            <AlertTriangle className="text-danger" size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">ปัญหา</p>
            <p className="text-xs text-gray-400 mt-0.5">รายงานปัญหาที่พบ</p>
          </div>
          <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
        </Link>
        <Link to="/farms" className="card-padded card-hover flex items-center gap-3 group">
          <span className="p-2 bg-primary-50 rounded-lg">
            <Map className="text-primary-600" size={18} />
          </span>
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

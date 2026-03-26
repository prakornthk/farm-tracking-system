import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Map, Grid3x3, ClipboardList, CheckCircle2, AlertTriangle } from 'lucide-react';
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
      color: 'bg-green-50 text-green-600',
      link: '/farms',
    },
    {
      label: 'งานค้าง',
      value: stats.pending_tasks,
      icon: ClipboardList,
      color: 'bg-blue-50 text-blue-600',
      link: '/tasks',
    },
    {
      label: 'งานเสร็จวันนี้',
      value: stats.completed_tasks_today,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600',
      link: '/tasks',
    },
    {
      label: 'ปัญหาเปิด',
      value: stats.open_problems,
      icon: AlertTriangle,
      color: 'bg-orange-50 text-orange-600',
      link: '/problems',
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={execute} />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">แดชบอร์ด</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className={`p-2 rounded-lg ${card.color}`}>
                <card.icon size={20} />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Plant Status Breakdown */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">สถานะต้นไม้</h2>
        {stats.plant_status_breakdown?.length > 0 ? (
          <div className="space-y-3">
            {stats.plant_status_breakdown.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 capitalize">{item.status}</span>
                    <span className="text-gray-500">{item.count} ต้น</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((item.count / stats.total_plants) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/tasks" className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3">
          <ClipboardList className="text-orange-500" size={24} />
          <div>
            <p className="font-medium text-gray-900">งานทั้งหมด</p>
            <p className="text-xs text-gray-500">ดูและจัดการงาน</p>
          </div>
        </Link>
        <Link to="/problems" className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3">
          <AlertTriangle className="text-red-500" size={24} />
          <div>
            <p className="font-medium text-gray-900">ปัญหา</p>
            <p className="text-xs text-gray-500">รายงานปัญหาที่พบ</p>
          </div>
        </Link>
        <Link to="/farms" className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3">
          <Map className="text-green-500" size={24} />
          <div>
            <p className="font-medium text-gray-900">ฟาร์ม</p>
            <p className="text-xs text-gray-500">จัดการฟาร์มและโซน</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

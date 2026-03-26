import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  LandPlot,
  ClipboardList,
  AlertTriangle,
  Users,
  Menu,
  X,
  LogOut,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, roles: ['owner', 'manager', 'worker'] },
  { path: '/farms', label: 'ฟาร์ม', icon: LandPlot, roles: ['owner', 'manager'] },
  { path: '/zones', label: 'โซน', icon: LayoutGrid, roles: ['owner', 'manager'] },
  { path: '/tasks', label: 'งาน', icon: ClipboardList, roles: ['owner', 'manager', 'worker'] },
  { path: '/problems', label: 'ปัญหา', icon: AlertTriangle, roles: ['owner', 'manager', 'worker'] },
  { path: '/users', label: 'ผู้ใช้', icon: Users, roles: ['owner'] },
];

const roleLabels = {
  owner: 'เจ้าของ',
  manager: 'ผู้จัดการ',
  worker: 'พนักงาน',
};

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const visibleNav = navItems.filter((item) => hasRole(...item.roles));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌱</span>
              <span className="font-bold text-lg text-green-700">Farm Admin</span>
            </div>
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(false)}
              aria-label="ปิดเมนู"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'ผู้ใช้'}</p>
                <p className="text-xs text-gray-500">{roleLabels[user?.role] || user?.role || '—'}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {visibleNav.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150 group relative
                    ${isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  {/* Active left border indicator */}
                  <span
                    className={`
                      absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full h-5
                      transition-all duration-150
                      ${isActive ? 'bg-green-600 h-6' : 'bg-transparent h-0'}
                    `}
                    aria-hidden="true"
                  />
                  <item.icon size={18} className={isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              aria-label="ออกจากระบบ"
            >
              <LogOut size={18} aria-hidden="true" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(true)}
                aria-label="เปิดเมนู"
              >
                <Menu size={22} />
              </button>

              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
                <Link to="/dashboard" className="text-gray-400 hover:text-green-600 transition-colors">
                  <LayoutDashboard size={16} />
                </Link>
                {location.pathname !== '/dashboard' && (
                  <>
                    <ChevronRight size={14} className="text-gray-300" />
                    <span className="text-gray-700 font-medium capitalize">
                      {location.pathname.split('/')[1]}
                    </span>
                  </>
                )}
              </nav>
            </div>

            {/* Page title (mobile) */}
            <h1 className="text-sm font-semibold text-gray-900 lg:hidden capitalize">
              {location.pathname === '/dashboard' ? 'แดชบอร์ด' : location.pathname.split('/')[1]}
            </h1>

            {/* Spacer for desktop */}
            <div className="hidden lg:block" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

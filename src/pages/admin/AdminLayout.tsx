import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const NAV = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/products', label: 'Products' },
  { path: '/admin/categories', label: 'Categories' },
  { path: '/admin/orders', label: 'Orders' },
  { path: '/admin/customers', label: 'Customers' },
  { path: '/admin/hero-slides', label: 'Hero Slides' },
  { path: '/admin/media', label: 'Media Library' },
  { path: '/admin/translations', label: 'Translations' },
  { path: '/admin/returns', label: 'Returns' },
  { path: '/admin/settings', label: 'Settings' },
];

/** BRD §3.9 — admin UI in English only; restricted by role. */
export function AdminLayout() {
  const { profile, loading, initialized, signOut } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/en/login');
  };

  if (loading || !initialized) return <div className="p-8">Loading...</div>;
  if (!profile || !['administrator', 'store_manager', 'support_agent'].includes(profile.role)) {
    return <Navigate to="/en/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-gray-900 text-white p-4 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-bold">Admin</h1>
          <Link to="/en" target="_blank" title="Visit Store"
            className="text-gray-400 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV.map((item) => (
            <Link key={item.path} to={item.path}
              className={`block px-3 py-2 rounded text-sm ${location.pathname === item.path ? 'bg-gray-700' : 'hover:bg-gray-800'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-700 pt-4 mt-4">
          <p className="text-xs text-gray-400 truncate mb-2">{profile.email}</p>
          <button onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-gray-800 rounded flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-8">
        <Outlet />
      </main>
    </div>
  );
}

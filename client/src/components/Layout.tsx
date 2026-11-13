import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FilePlus2, ClipboardList, CheckSquare, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const navLinkClass = (path: string) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      location.pathname === path
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/requests/my" className="font-bold text-slate-900 text-lg tracking-tight">
              ApprovalFlow
            </Link>

            {user && (
              <nav className="flex items-center gap-1">
                <Link to="/requests/my" className={navLinkClass('/requests/my')}>
                  <ClipboardList className="w-4 h-4" />
                  <span>My Requests</span>
                </Link>
                <Link to="/requests/new" className={navLinkClass('/requests/new')}>
                  <FilePlus2 className="w-4 h-4" />
                  <span>New Request</span>
                </Link>
                {user.role === 'REVIEWER' && (
                  <Link
                    to="/reviewer/pending"
                    className={navLinkClass('/reviewer/pending')}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Pending Reviews</span>
                  </Link>
                )}
              </nav>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500">{user.role}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}

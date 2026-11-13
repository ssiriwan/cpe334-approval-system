import { Link } from 'react-router-dom';
import { ShieldAlert, FileQuestion } from 'lucide-react';

export function ForbiddenPage() {
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 p-8 text-center mt-10">
      <div className="inline-flex p-3 rounded-full bg-rose-50 text-rose-600 mb-3">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 mb-1">403 — Forbidden</h1>
      <p className="text-sm text-slate-600 mb-5">
        You do not have permission to view this page.
      </p>
      <Link
        to="/requests/my"
        className="inline-flex px-4 py-2 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
      >
        Go to My Requests
      </Link>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 p-8 text-center mt-10">
      <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-600 mb-3">
        <FileQuestion className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 mb-1">404 — Page Not Found</h1>
      <p className="text-sm text-slate-600 mb-5">
        The page you requested does not exist.
      </p>
      <Link
        to="/requests/my"
        className="inline-flex px-4 py-2 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
      >
        Go to My Requests
      </Link>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, RefreshCw } from 'lucide-react';
import { ApiError, apiFetch, type ApprovalRequest } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

export function MyRequestsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ requests: ApprovalRequest[] }>('/api/requests/my');
      setRequests(data.requests);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.code}: ${err.message}`);
      } else {
        setError('Unable to load your requests.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
          <p className="text-sm text-slate-600 mt-1">
            Track status and approval history of your submitted requests.
          </p>
        </div>

        <Link
          to="/requests/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          <FilePlus2 className="w-4 h-4" />
          <span>New Request</span>
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-rose-700 text-sm"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadRequests()}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-100"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Loading your requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-600 text-sm mb-4">You have not submitted any requests yet.</p>
          <Link
            to="/requests/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Create your first request</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Request No</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Amount (THB)</th>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      {req.requestNo}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{req.title}</td>
                    <td className="py-3.5 px-4 text-slate-600">{req.category}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900">
                      {Number(req.amount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {req.assignedReviewer?.name ?? '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/requests/${req.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-xs"
                      >
                        View Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldAlert } from 'lucide-react';
import {
  ApiError,
  apiFetch,
  type ApprovalHistory,
  type ApprovalRequest,
} from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [histories, setHistories] = useState<ApprovalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status: number; code: string; message: string } | null>(
    null
  );

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{
          request: ApprovalRequest;
          histories: ApprovalHistory[];
        }>(`/api/requests/${id}`);
        if (active) {
          setRequest(data.request);
          setHistories(data.histories);
        }
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError) {
          setError({ status: err.status, code: err.code, message: err.message });
        } else {
          setError({
            status: 500,
            code: 'UNKNOWN_ERROR',
            message: 'Unable to load request detail.',
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    if (id) {
      void load();
    }
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
        Loading request details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="inline-flex p-3 rounded-full bg-rose-50 text-rose-600 mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          {error.status === 403
            ? 'Access Denied'
            : error.status === 404
            ? 'Request Not Found'
            : 'Error Loading Request'}
        </h2>
        <p className="text-sm text-slate-600 mb-5">
          {error.code}: {error.message}
        </p>
        <Link
          to="/requests/my"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Requests</span>
        </Link>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          to="/requests/my"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Requests</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-mono text-xs text-slate-500 block">{request.requestNo}</span>
            <h1 className="text-2xl font-bold text-slate-900">{request.title}</h1>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase">Amount</span>
          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {Number(request.amount).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            THB
          </p>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 uppercase">Category</span>
          <p className="text-sm font-medium text-slate-900 mt-0.5">{request.category}</p>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 uppercase">Requester</span>
          <p className="text-sm text-slate-900 mt-0.5">
            {request.requester?.name ?? request.requesterId}
          </p>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 uppercase">Assigned Reviewer</span>
          <p className="text-sm text-slate-900 mt-0.5">
            {request.assignedReviewer?.name ?? 'Unassigned'}
          </p>
        </div>

        <div className="sm:col-span-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase">Description</span>
          <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{request.description}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Approval History</span>
        </h2>

        {histories.length === 0 ? (
          <p className="text-sm text-slate-500">No history entries recorded.</p>
        ) : (
          <ol className="space-y-4">
            {histories.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start justify-between gap-4 border-l-2 border-indigo-200 pl-4 py-0.5"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {entry.action}{' '}
                    <span className="font-normal text-slate-600">
                      by {entry.actor?.name ?? entry.actorId}
                    </span>
                  </p>
                  {entry.comment && (
                    <p className="text-sm text-slate-700 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                      {entry.comment}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Clock, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import {
  ApiError,
  apiFetch,
  type ApprovalHistory,
  type ApprovalRequest,
  type RequestCategory,
} from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const CATEGORIES: RequestCategory[] = ['EQUIPMENT', 'TRAVEL', 'SOFTWARE', 'SUPPLIES'];

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [histories, setHistories] = useState<ApprovalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status: number; code: string; message: string } | null>(
    null
  );
  const [auditRefresh, setAuditRefresh] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null,
  });

  // F-06: Edit & Resubmit form state for RETURNED requests
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<RequestCategory>('EQUIPMENT');
  const [editDescription, setEditDescription] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState<string | null>(null);
  const [resubmitSuccess, setResubmitSuccess] = useState<string | null>(null);

  /**
   * F-05: explicitly re-read the dedicated read-only audit endpoint so the
   * UI demonstrates the API -> DB retrieval instead of only the detail payload.
   */
  async function refreshAuditTrail() {
    if (!id) return;
    setAuditRefresh({ loading: true, error: null });
    try {
      const data = await apiFetch<{
        requestId: string;
        histories: ApprovalHistory[];
      }>(`/api/requests/${id}/history`);
      setHistories(data.histories);
      setAuditRefresh({ loading: false, error: null });
    } catch (err) {
      setAuditRefresh({
        loading: false,
        error:
          err instanceof ApiError
            ? `${err.code}: ${err.message}`
            : 'Unable to refresh the audit trail.',
      });
    }
  }

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
          setEditTitle(data.request.title);
          setEditAmount(data.request.amount);
          setEditCategory(data.request.category);
          setEditDescription(data.request.description);
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

  function validateResubmit(): Record<string, string> {
    const errs: Record<string, string> = {};
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 150) {
      errs.title = 'Title must be between 3 and 150 characters.';
    }

    const trimmedAmount = editAmount.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(trimmedAmount)) {
      errs.amount = 'Amount must be a valid positive number with at most 2 decimal places.';
    } else {
      const parsed = Number(trimmedAmount);
      if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 9999999999.99) {
        errs.amount = 'Amount must be greater than 0 and at most 9,999,999,999.99.';
      }
    }

    const trimmedDesc = editDescription.trim();
    if (trimmedDesc.length < 1 || trimmedDesc.length > 1000) {
      errs.description = 'Description must be between 1 and 1,000 characters.';
    }

    return errs;
  }

  async function handleResubmit(e: FormEvent) {
    e.preventDefault();
    setResubmitError(null);
    setResubmitSuccess(null);

    const validationErrors = validateResubmit();
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setResubmitting(true);
    try {
      const data = await apiFetch<{
        request: ApprovalRequest;
        history: ApprovalHistory;
      }>(`/api/requests/${id}/resubmit`, {
        method: 'POST',
        body: JSON.stringify({
          title: editTitle.trim(),
          amount: editAmount.trim(),
          category: editCategory,
          description: editDescription.trim(),
        }),
      });

      setRequest(data.request);
      setHistories((prev) => [...prev, data.history]);
      setResubmitSuccess('Request has been resubmitted successfully and returned to PENDING.');
    } catch (err) {
      if (err instanceof ApiError) {
        setResubmitError(`${err.code}: ${err.message}`);
      } else {
        setResubmitError('Unable to resubmit request. Please try again.');
      }
    } finally {
      setResubmitting(false);
    }
  }

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

  const isOwner = Boolean(user && user.id === request.requesterId);
  const latestReturnHistory = histories
    .filter((h) => h.action === 'RETURNED')
    .slice(-1)[0];

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

      {/* F-06: Returned for Revision Alert & Reason Notice */}
      {request.status === 'RETURNED' && (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-sm space-y-2">
          <div className="flex items-center gap-2 font-semibold text-orange-800">
            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
            <span>Returned for Revision</span>
          </div>
          {latestReturnHistory?.comment && (
            <div className="bg-white/80 p-3 rounded-lg border border-orange-200">
              <span className="font-medium text-xs uppercase text-orange-700 block mb-1">
                Reviewer comment ({latestReturnHistory.actor?.name ?? latestReturnHistory.actorId}):
              </span>
              <p className="whitespace-pre-wrap text-slate-800 text-sm">
                {latestReturnHistory.comment}
              </p>
            </div>
          )}
          <p className="text-xs text-orange-700">
            {isOwner
              ? 'Update the editable fields below and resubmit when ready. The reviewer will be re-assigned automatically.'
              : 'Waiting for the requester to make revisions and resubmit.'}
          </p>
        </div>
      )}

      {/* Resubmit Success/Error notifications */}
      {resubmitSuccess && (
        <div
          role="status"
          className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
        >
          {resubmitSuccess}
        </div>
      )}

      {/* F-06: Owner Edit & Resubmit form when status is RETURNED */}
      {isOwner && request.status === 'RETURNED' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" />
            <span>Edit & Resubmit Request</span>
          </h2>

          {resubmitError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm"
            >
              {resubmitError}
            </div>
          )}

          <form onSubmit={handleResubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium text-slate-700 mb-1">
                Title (3-150 characters)
              </label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={150}
                disabled={resubmitting}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {formErrors.title && <p className="mt-1 text-xs text-rose-600">{formErrors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-amount" className="block text-sm font-medium text-slate-700 mb-1">
                  Amount (THB)
                </label>
                <input
                  id="edit-amount"
                  type="text"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  disabled={resubmitting}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {formErrors.amount && <p className="mt-1 text-xs text-rose-600">{formErrors.amount}</p>}
              </div>

              <div>
                <label htmlFor="edit-category" className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  id="edit-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as RequestCategory)}
                  disabled={resubmitting}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-slate-700 mb-1">
                Description (1-1,000 characters)
              </label>
              <textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                maxLength={1000}
                disabled={resubmitting}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {formErrors.description && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.description}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={resubmitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {resubmitting ? 'Resubmitting...' : 'Resubmit Request'}
            </button>
          </form>
        </div>
      ) : (
        /* Read-only Request Overview */
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
      )}

      {/* History Audit Trail */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Approval History</span>
          </h2>
          <button
            type="button"
            onClick={() => void refreshAuditTrail()}
            disabled={auditRefresh.loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${auditRefresh.loading ? 'animate-spin' : ''}`} />
            {auditRefresh.loading ? 'Refreshing...' : 'Refresh audit trail'}
          </button>
        </div>

        {auditRefresh.error && (
          <p className="mb-3 rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700">
            {auditRefresh.error}
          </p>
        )}

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

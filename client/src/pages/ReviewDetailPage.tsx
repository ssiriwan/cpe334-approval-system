import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckSquare, Clock, ShieldAlert } from 'lucide-react';
import {
  ApiError,
  apiFetch,
  type ApprovalHistory,
  type ApprovalRequest,
} from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

type Decision = 'APPROVE' | 'REJECT';

interface DecisionErrors {
  comment?: string;
  decision?: string;
}

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [histories, setHistories] = useState<ApprovalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ status: number; message: string } | null>(null);

  const [decision, setDecision] = useState<Decision>('APPROVE');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<DecisionErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
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
          setLoadError({ status: err.status, message: `${err.code}: ${err.message}` });
        } else {
          setLoadError({ status: 500, message: 'Unable to load request detail.' });
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

  const isOwner = useMemo(
    () => Boolean(user && request && request.requesterId === user.id),
    [user, request]
  );
  const isAssigned = useMemo(
    () => Boolean(user && request && request.assignedReviewerId === user.id),
    [user, request]
  );

  function validate(): DecisionErrors {
    const nextErrors: DecisionErrors = {};
    const trimmed = comment.trim();

    if (decision === 'REJECT') {
      if (trimmed.length < 3) {
        nextErrors.comment = 'A rejection comment of at least 3 characters is required.';
      } else if (trimmed.length > 500) {
        nextErrors.comment = 'Comment must not exceed 500 characters.';
      }
    } else if (trimmed.length > 500) {
      nextErrors.comment = 'Comment must not exceed 500 characters.';
    }

    return nextErrors;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch<{
        request: ApprovalRequest;
        history: ApprovalHistory;
      }>(`/api/requests/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          ...(comment.trim().length > 0 ? { comment: comment.trim() } : {}),
        }),
      });

      setRequest(data.request);
      setHistories((prev) => [...prev, data.history]);
      setComment('');
      setSuccessMessage(`Decision recorded: request is now ${data.request.status}.`);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(`${err.code}: ${err.message}`);
      } else {
        setSubmitError('Unable to record the decision. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
        Loading request for review...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="inline-flex p-3 rounded-full bg-rose-50 text-rose-600 mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          {loadError.status === 403
            ? 'Access Denied'
            : loadError.status === 404
            ? 'Request Not Found'
            : 'Error Loading Request'}
        </h2>
        <p className="text-sm text-slate-600 mb-5">{loadError.message}</p>
        <Link
          to="/reviewer/pending"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pending Reviews</span>
        </Link>
      </div>
    );
  }

  if (!request) return null;

  const canAttemptDecision = request.status === 'PENDING';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          to="/reviewer/pending"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pending Reviews</span>
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

      {isOwner && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            You created this request. Self-approval is forbidden even with the REVIEWER role, so
            the server will reject this decision with <code>SELF_APPROVAL_NOT_ALLOWED</code>.
          </span>
        </div>
      )}

      {!isAssigned && !isOwner && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            This request is not assigned to you. Only the assigned reviewer may decide, so the
            server will reject this attempt with <code>ACCESS_DENIED</code>.
          </span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-slate-500" />
          <span>Decision</span>
        </h2>

        {successMessage && (
          <div
            role="status"
            className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
          >
            {successMessage}
          </div>
        )}

        {!canAttemptDecision ? (
          <p className="text-sm text-slate-600">
            This request has already been decided and is now {request.status}. Decisions are
            single-shot and cannot be changed.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {submitError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm"
              >
                {submitError}
              </div>
            )}

            <fieldset>
              <legend className="block text-sm font-medium text-slate-700 mb-2">Outcome</legend>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVE"
                    checked={decision === 'APPROVE'}
                    onChange={() => setDecision('APPROVE')}
                    disabled={submitting}
                  />
                  <span>Approve</span>
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="decision"
                    value="REJECT"
                    checked={decision === 'REJECT'}
                    onChange={() => setDecision('REJECT')}
                    disabled={submitting}
                  />
                  <span>Reject</span>
                </label>
              </div>
            </fieldset>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-1">
                Comment {decision === 'REJECT' ? '(required, 3-500 characters)' : '(optional)'}
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={500}
                disabled={submitting}
                placeholder={
                  decision === 'REJECT'
                    ? 'Explain why this request is rejected'
                    : 'Optional note for the audit trail'
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.comment && <p className="mt-1 text-xs text-rose-600">{errors.comment}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Decision'}
            </button>
          </form>
        )}
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

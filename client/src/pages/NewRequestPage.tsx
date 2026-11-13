import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { ApiError, apiFetch, type ApprovalRequest, type RequestCategory } from '../lib/api';

const CATEGORIES: { value: RequestCategory; label: string }[] = [
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'SUPPLIES', label: 'Supplies' },
];

export function NewRequestPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<RequestCategory>('EQUIPMENT');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  function validateClient(): boolean {
    const errors: Record<string, string> = {};
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const numAmount = Number(amount);

    if (trimmedTitle.length < 3 || trimmedTitle.length > 150) {
      errors.title = 'Title must be between 3 and 150 characters.';
    }
    if (!amount || Number.isNaN(numAmount) || numAmount <= 0 || numAmount > 9999999999.99) {
      errors.amount = 'Amount must be greater than 0 and up to 9,999,999,999.99.';
    } else if (Math.abs(numAmount * 100 - Math.round(numAmount * 100)) >= 1e-8) {
      errors.amount = 'Amount must have at most 2 decimal places.';
    }
    if (trimmedDesc.length < 1 || trimmedDesc.length > 1000) {
      errors.description = 'Description is required (max 1,000 characters).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!validateClient()) return;

    setSubmitting(true);
    try {
      const data = await apiFetch<{ request: ApprovalRequest }>('/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          amount: Number(amount),
          category,
          description: description.trim(),
        }),
      });
      navigate(`/requests/${data.request.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(`${err.code}: ${err.message}`);
      } else {
        setApiError('Failed to create request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          to="/requests/my"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Requests</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Approval Request</h1>
        <p className="text-sm text-slate-600 mt-1">
          Submit an expense or purchase request for reviewer approval.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {apiError && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm"
          >
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
              Request Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Monitor Stand for Workstation"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">
                Amount (THB)
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1500.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {fieldErrors.amount && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.amount}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as RequestCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Business Justification / Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain why this expense is needed..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/requests/my"
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

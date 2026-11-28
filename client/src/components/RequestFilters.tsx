import { useEffect, useState } from 'react';

export interface FilterValues {
  status: string;
  category: string;
  from: string;
  to: string;
}

export const EMPTY_FILTERS: FilterValues = { status: '', category: '', from: '', to: '' };

// Title-case labels keep option text distinct from status badges in tables,
// so existing table assertions remain unambiguous. Values stay uppercase.
const STATUSES: Array<[string, string]> = [
  ['PENDING', 'Pending'],
  ['PENDING_STAGE2', 'Pending Stage 2'],
  ['RETURNED', 'Returned'],
  ['APPROVED', 'Approved'],
  ['REJECTED', 'Rejected'],
];
const CATEGORIES: Array<[string, string]> = [
  ['EQUIPMENT', 'Equipment'],
  ['TRAVEL', 'Travel'],
  ['SOFTWARE', 'Software'],
  ['SUPPLIES', 'Supplies'],
];

export function fromParams(params: URLSearchParams): FilterValues {
  return {
    status: params.get('status') ?? '',
    category: params.get('category') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
  };
}

export function toParams(values: FilterValues): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  return params;
}

export function toQuery(values: FilterValues): string {
  const query = toParams(values).toString();
  return query ? `?${query}` : '';
}

interface Props {
  value: FilterValues;
  onChange: (next: FilterValues) => void;
  count: number;
  noun: string;
}

/**
 * F-09 shared filter bar. Client state is a UI concern only: the page re-fetches
 * from the server with the query string, so backend authorization and filtering
 * remain the source of truth.
 */
export function RequestFilters({ value, onChange, count, noun }: Props) {
  const [draft, setDraft] = useState<FilterValues>(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const field = (key: keyof FilterValues) => ({
    value: draft[key],
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => setDraft((prev) => ({ ...prev, [key]: event.target.value })),
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="block text-xs font-medium text-slate-600">
          Status
          <select
            aria-label="Filter by status"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
            {...field('status')}
          >
            <option value="">All statuses</option>
            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Category
          <select
            aria-label="Filter by category"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
            {...field('category')}
          >
            <option value="">All categories</option>
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          From
          <input
            aria-label="Filter from date"
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            {...field('from')}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          To
          <input
            aria-label="Filter to date"
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            {...field('to')}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(draft)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(EMPTY_FILTERS);
            onChange(EMPTY_FILTERS);
          }}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Clear
        </button>
        <span className="text-xs text-slate-500" role="status">
          {count} {noun}
        </span>
      </div>
    </div>
  );
}

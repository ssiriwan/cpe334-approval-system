export type Role = 'REQUESTER' | 'REVIEWER' | 'ADMIN';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RequestCategory = 'EQUIPMENT' | 'TRAVEL' | 'SOFTWARE' | 'SUPPLIES';
export type HistoryAction = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface ApprovalRequest {
  id: string;
  requestNo: string;
  title: string;
  amount: string;
  category: RequestCategory;
  description: string;
  status: RequestStatus;
  requesterId: string;
  requester?: PublicUser;
  assignedReviewerId: string | null;
  assignedReviewer?: PublicUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalHistory {
  id: string;
  requestId: string;
  actorId: string;
  actor?: PublicUser;
  action: HistoryAction;
  comment: string | null;
  createdAt: string;
}

export interface ApiErrorDetail {
  path?: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = body?.error;
    throw new ApiError(
      response.status,
      err?.code ?? 'UNKNOWN_ERROR',
      err?.message ?? 'An unexpected error occurred.',
      err?.details
    );
  }

  return body.data as T;
}

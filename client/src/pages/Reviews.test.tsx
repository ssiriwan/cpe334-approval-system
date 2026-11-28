/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PendingReviewsPage } from './PendingReviewsPage';
import { ReviewDetailPage } from './ReviewDetailPage';

const authState = vi.hoisted(() => ({
  user: {
    id: 'r-1',
    name: 'T Reviewer',
    email: 't.reviewer@cpe334.local',
    role: 'REVIEWER' as 'REQUESTER' | 'REVIEWER' | 'ADMIN',
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: authState.user,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

vi.mock('../components/AttachmentSection', () => ({
  AttachmentSection: () => null,
}));

const REVIEWER = {
  id: 'r-1',
  name: 'T Reviewer',
  email: 't.reviewer@cpe334.local',
  role: 'REVIEWER' as const,
};

const REQUESTER = {
  id: 'u-1',
  name: 'Oum Requester',
  email: 'oum.requester@cpe334.local',
  role: 'REQUESTER' as const,
};

function buildRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'req-1',
    requestNo: 'REQ-20261112-0001',
    title: 'Ergonomic Keyboard',
    amount: '1500.00',
    category: 'EQUIPMENT',
    description: 'Split keyboard for the workstation',
    status: 'PENDING',
    requesterId: 'u-1',
    requester: REQUESTER,
    assignedReviewerId: 'r-1',
    assignedReviewer: REVIEWER,
    createdAt: new Date('2026-11-12T09:00:00Z').toISOString(),
    updatedAt: new Date('2026-11-12T09:00:00Z').toISOString(),
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderReviewDetail() {
  return render(
    <MemoryRouter initialEntries={['/reviewer/requests/req-1']}>
      <Routes>
        <Route path="/reviewer/requests/:id" element={<ReviewDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Reviewer UI pages', () => {
  beforeEach(() => {
    authState.user = { ...REVIEWER };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PendingReviewsPage renders the assigned queue and an empty state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ data: { requests: [buildRequest()] } })
    );

    const { unmount } = render(
      <MemoryRouter>
        <PendingReviewsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('REQ-20261112-0001')).toBeInTheDocument();
    });
    expect(screen.getByText('Ergonomic Keyboard')).toBeInTheDocument();
    expect(screen.getByText('1,500.00')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute(
      'href',
      '/reviewer/requests/req-1'
    );
    unmount();

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ data: { requests: [] } })
    );

    render(
      <MemoryRouter>
        <PendingReviewsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No assigned pending requests/i)).toBeInTheDocument();
    });
  });

  it('ReviewDetailPage validates the REJECT comment before calling the API', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            request: buildRequest(),
            histories: [
              {
                id: 'h-1',
                requestId: 'req-1',
                actorId: 'u-1',
                actor: REQUESTER,
                action: 'SUBMITTED',
                comment: null,
                createdAt: new Date('2026-11-12T09:00:00Z').toISOString(),
              },
            ],
          },
        })
      );

    renderReviewDetail();

    await waitFor(() => {
      expect(screen.getByText('Ergonomic Keyboard')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('radio', { name: /Reject/i }));
    await user.click(screen.getByRole('button', { name: /Submit Decision/i }));

    expect(
      screen.getByText(/A rejection comment of at least 3 characters is required/i)
    ).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('ReviewDetailPage surfaces SELF_APPROVAL_NOT_ALLOWED for an owner (E2E-03 contract)', async () => {
    const user = userEvent.setup();
    authState.user = { ...REVIEWER };

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            request: buildRequest({ requesterId: 'r-1', requester: REVIEWER }),
            histories: [],
          },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: 'SELF_APPROVAL_NOT_ALLOWED',
              message: 'You cannot approve or reject your own request.',
            },
          },
          403
        )
      );

    renderReviewDetail();

    await waitFor(() => {
      expect(screen.getByText(/Self-approval is forbidden/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Submit Decision/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/SELF_APPROVAL_NOT_ALLOWED/);
    });
  });

  it('ReviewDetailPage validates return comment and calls return API', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            request: buildRequest(),
            histories: [],
          },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            request: buildRequest({ status: 'RETURNED' }),
            history: {
              id: 'h-2',
              requestId: 'req-1',
              actorId: 'r-1',
              action: 'RETURNED',
              comment: 'Please clarify vendor details',
              createdAt: new Date().toISOString(),
            },
          },
        })
      );

    renderReviewDetail();

    await waitFor(() => {
      expect(screen.getByText('Ergonomic Keyboard')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('radio', { name: /Return for Revision/i }));
    await user.click(screen.getByRole('button', { name: /Return Request/i }));

    expect(
      screen.getByText(/A return comment of at least 3 characters is required/i)
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Comment/i), 'Please clarify vendor details');
    await user.click(screen.getByRole('button', { name: /Return Request/i }));

    await waitFor(() => {
      expect(screen.getByText(/Request returned for revision/i)).toBeInTheDocument();
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('F-07: PENDING_STAGE2 request shows a stage badge and still allows a decision', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            request: buildRequest({
              status: 'PENDING_STAGE2',
              stage: 2,
              amount: '7500.00',
            }),
            histories: [
              {
                id: 'h-1',
                requestId: 'req-1',
                actorId: 'm-1',
                actor: { ...REVIEWER, id: 'm-1', name: 'Manager Hybrid' },
                action: 'APPROVED',
                stage: 1,
                comment: 'Stage 1 approved',
                createdAt: new Date('2026-11-12T09:05:00Z').toISOString(),
              },
            ],
          },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            request: buildRequest({ status: 'APPROVED', stage: 2, amount: '7500.00' }),
            history: {
              id: 'h-2',
              action: 'APPROVED',
              stage: 2,
              comment: 'Stage 2 approved',
            },
          },
        })
      );

    renderReviewDetail();

    await waitFor(() => {
      expect(screen.getByText('Stage 2 / 2')).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Stage 1/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Submit Decision/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Submit Decision/i }));

    await waitFor(() => {
      expect(screen.getByText(/request is now APPROVED/i)).toBeInTheDocument();
    });
  });
});

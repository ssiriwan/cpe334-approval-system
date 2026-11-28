/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NewRequestPage } from './NewRequestPage';
import { MyRequestsPage } from './MyRequestsPage';
import { RequestDetailPage } from './RequestDetailPage';

const authState = vi.hoisted(() => ({
  user: {
    id: 'u-1',
    name: 'Oum Requester',
    email: 'oum.requester@cpe334.local',
    role: 'REQUESTER' as 'REQUESTER' | 'REVIEWER' | 'ADMIN',
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

describe('Requester UI pages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('NewRequestPage shows client validation errors when fields are invalid', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/requests/new']}>
        <Routes>
          <Route path="/requests/new" element={<NewRequestPage />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /Submit Request/i }));

    expect(screen.getByText(/Title must be between 3 and 150 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Amount must be greater than 0/i)).toBeInTheDocument();
    expect(screen.getByText(/Description is required/i)).toBeInTheDocument();
  });

  it('NewRequestPage submits valid payload and displays API error banner on rejection', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'VALIDATION_ERROR', message: 'Request payload is invalid.' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    );

    render(
      <MemoryRouter initialEntries={['/requests/new']}>
        <Routes>
          <Route path="/requests/new" element={<NewRequestPage />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/Request Title/i), 'Test Laptop');
    await user.type(screen.getByLabelText(/Amount/i), '25000');
    await user.type(screen.getByLabelText(/Description/i), 'Needed for dev work');
    await user.click(screen.getByRole('button', { name: /Submit Request/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/VALIDATION_ERROR/i);
    });
  });

  it('MyRequestsPage renders empty state and populated rows cleanly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { requests: [] } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const { unmount } = render(
      <MemoryRouter>
        <MyRequestsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/You have not submitted any requests yet/i)).toBeInTheDocument();
    });
    unmount();

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            requests: [
              {
                id: 'req-1',
                requestNo: 'REQ-20261111-0001',
                title: 'Standing Desk',
                amount: '5400.00',
                category: 'EQUIPMENT',
                description: 'Desk',
                status: 'PENDING',
                requesterId: 'u-1',
                assignedReviewerId: 'r-1',
                assignedReviewer: { id: 'r-1', name: 'T Reviewer', email: 't@cpe.local', role: 'REVIEWER' },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    render(
      <MemoryRouter>
        <MyRequestsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('REQ-20261111-0001')).toBeInTheDocument();
    });
    expect(screen.getByText('Standing Desk')).toBeInTheDocument();
    expect(screen.getByText('5,400.00')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('RequestDetailPage renders returned notice and enables owner to edit and resubmit', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              request: {
                id: 'req-returned',
                requestNo: 'REQ-20261128-0001',
                title: 'Original Title',
                amount: '1500.00',
                category: 'EQUIPMENT',
                description: 'Original Description',
                status: 'RETURNED',
                requesterId: 'u-1',
                assignedReviewerId: 'r-1',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              histories: [
                {
                  id: 'h-1',
                  requestId: 'req-returned',
                  actorId: 'r-1',
                  actor: { id: 'r-1', name: 'T Reviewer' },
                  action: 'RETURNED',
                  comment: 'Please adjust specs',
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              request: {
                id: 'req-returned',
                requestNo: 'REQ-20261128-0001',
                title: 'Updated Title',
                amount: '2000.00',
                category: 'EQUIPMENT',
                description: 'Updated Description',
                status: 'PENDING',
                requesterId: 'u-1',
                assignedReviewerId: 'r-1',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              history: {
                id: 'h-2',
                requestId: 'req-returned',
                actorId: 'u-1',
                action: 'RESUBMITTED',
                comment: null,
                createdAt: new Date().toISOString(),
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

    render(
      <MemoryRouter initialEntries={['/requests/req-returned']}>
        <Routes>
          <Route path="/requests/:id" element={<RequestDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Returned for Revision/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Please adjust specs/i).length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByRole('button', { name: /Resubmit Request/i })).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');

    await user.click(screen.getByRole('button', { name: /Resubmit Request/i }));

    await waitFor(() => {
      expect(screen.getByText(/Request has been resubmitted successfully/i)).toBeInTheDocument();
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

// Lab 6 UAT regression F-PB-01: the form must send a string amount so that
// large 2-decimal values are not rejected by floating-point arithmetic.
describe('Lab 6 UAT client regression', () => {
  it('F-PB-01: accepts 1234567.89 and sends it as a decimal string', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { request: { id: 'x' } } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);

    render(
      <MemoryRouter initialEntries={['/requests/new']}>
        <Routes>
          <Route path="/requests/new" element={<NewRequestPage />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/Request Title/i), 'UAT-Fin-01');
    await user.type(screen.getByLabelText(/Amount/i), '1234567.89');
    await user.type(screen.getByLabelText(/Description/i), 'Test Amount value.');
    await user.click(screen.getByRole('button', { name: /Submit Request/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body)).amount).toBe('1234567.89');
  });
});

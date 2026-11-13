/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NewRequestPage } from './NewRequestPage';
import { MyRequestsPage } from './MyRequestsPage';

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
});

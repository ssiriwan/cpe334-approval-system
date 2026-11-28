/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MyRequestsPage } from './MyRequestsPage';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('F-09 filter UI (TEST-18.5)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies filters to the API query, shows the server count and clears them', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        data: {
          requests: [
            {
              id: 'req-1',
              requestNo: 'REQ-20261112-0001',
              title: 'Software licence',
              amount: '2500.00',
              category: 'SOFTWARE',
              description: 'For the project',
              status: 'PENDING',
              requesterId: 'u-1',
              assignedReviewerId: 'r-1',
              createdAt: new Date('2026-11-12T03:00:00Z').toISOString(),
              updatedAt: new Date('2026-11-12T03:00:00Z').toISOString(),
            },
          ],
          count: 1,
        },
      })
    );

    render(
      <MemoryRouter initialEntries={['/requests/my']}>
        <MyRequestsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Software licence')).toBeInTheDocument();
    });
    expect(screen.getByRole('status')).toHaveTextContent('1 requests');

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'PENDING');
    await user.selectOptions(screen.getByLabelText('Filter by category'), 'SOFTWARE');
    await user.click(screen.getByRole('button', { name: /Apply filters/i }));

    await waitFor(() => {
      const lastPath = String(fetchSpy.mock.calls.at(-1)?.[0] ?? '');
      expect(lastPath).toContain('status=PENDING');
      expect(lastPath).toContain('category=SOFTWARE');
    });

    await user.click(screen.getByRole('button', { name: /Clear/i }));
    await waitFor(() => {
      const lastPath = String(fetchSpy.mock.calls.at(-1)?.[0] ?? '');
      expect(lastPath).toBe('/api/requests/my');
    });
  });
});

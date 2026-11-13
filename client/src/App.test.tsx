/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders login page when session is unauthenticated', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Required' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/ApprovalFlow/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });
});

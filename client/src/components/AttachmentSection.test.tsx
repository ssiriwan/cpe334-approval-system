/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttachmentSection } from './AttachmentSection';

describe('AttachmentSection Component (F-08 UI)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders empty state and loads attachment list', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            attachments: [
              {
                id: 'att-1',
                requestId: 'req-1',
                filename: 'invoice.pdf',
                mime: 'application/pdf',
                size: 2048,
                createdAt: new Date('2026-11-28T10:00:00Z').toISOString(),
                uploader: { id: 'u-1', name: 'Oum Requester', email: 'oum@cpe.local', role: 'REQUESTER' },
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    render(<AttachmentSection requestId="req-1" canUpload={true} />);

    await waitFor(() => {
      expect(screen.getByText('invoice.pdf')).toBeInTheDocument();
    });

    expect(screen.getByText(/2.0 KB/)).toBeInTheDocument();
    expect(screen.getByText(/Oum Requester/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Download/i })).toHaveAttribute(
      'href',
      '/api/attachments/att-1'
    );
  });

  it('enforces client validation for file type and uploads valid file', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { attachments: [] } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              attachment: {
                id: 'att-2',
                requestId: 'req-1',
                filename: 'receipt.png',
                mime: 'image/png',
                size: 1024,
                createdAt: new Date().toISOString(),
                uploader: { id: 'u-1', name: 'Oum Requester', email: 'oum@cpe.local', role: 'REQUESTER' },
              },
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        )
      );

    render(<AttachmentSection requestId="req-1" canUpload={true} />);

    await waitFor(() => {
      expect(screen.getByText(/No attachments uploaded yet/i)).toBeInTheDocument();
    });

    // Upload invalid file type (.txt) via change event
    const badFile = new globalThis.File(['plain text'], 'bad.txt', { type: 'text/plain' });
    const input = document.getElementById('attachment-file-input') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [badFile] } });
    expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();

    // Upload valid PNG
    const goodFile = new globalThis.File(['png bytes'], 'receipt.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [goodFile] } });

    const submitBtn = screen.getByRole('button', { name: /Upload Attachment/i });
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/uploaded successfully/i)).toBeInTheDocument();
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Download,
  File,
  FileText,
  Image,
  Paperclip,
  Upload,
} from 'lucide-react';
import {
  ApiError,
  apiFetch,
  type Attachment,
} from '../lib/api';

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileIcon(mime: string) {
  if (mime === 'application/pdf') {
    return <FileText className="w-5 h-5 text-rose-500" />;
  }
  if (mime.startsWith('image/')) {
    return <Image className="w-5 h-5 text-indigo-500" />;
  }
  return <File className="w-5 h-5 text-slate-500" />;
}

interface AttachmentSectionProps {
  requestId: string;
  canUpload: boolean;
}

export function AttachmentSection({ requestId, canUpload }: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  async function loadAttachments() {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await apiFetch<{ attachments?: Attachment[] }>(
        `/api/requests/${requestId}/attachments`
      );
      setAttachments(Array.isArray(res?.attachments) ? res.attachments : []);
    } catch (err) {
      setAttachments([]);
      if (err instanceof ApiError) {
        setFetchError(`${err.code}: ${err.message}`);
      } else {
        setFetchError('Unable to load attachments.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (requestId) {
      void loadAttachments();
    }
  }, [requestId]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    setUploadError(null);
    setUploadSuccess(null);

    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setClientError('Invalid file type. Allowed formats: PDF, PNG, JPEG.');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setClientError('File exceeds maximum size limit of 5 MB.');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setClientError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`/api/requests/${requestId}/attachments`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const err = body?.error;
        throw new ApiError(
          response.status,
          err?.code ?? 'UNKNOWN_ERROR',
          err?.message ?? 'Failed to upload attachment.',
          err?.details
        );
      }

      const newAttachment = body.data?.attachment as Attachment;
      if (newAttachment) {
        setAttachments((prev) => [...prev, newAttachment]);
      } else {
        await loadAttachments();
      }

      setSelectedFile(null);
      setUploadSuccess(`Attachment "${selectedFile.name}" uploaded successfully.`);
      const input = document.getElementById('attachment-file-input') as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (err) {
      if (err instanceof ApiError) {
        setUploadError(`${err.code}: ${err.message}`);
      } else {
        setUploadError('Failed to upload attachment. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-slate-500" />
          <span>Attachments</span>
          <span className="text-xs font-normal text-slate-500">
            ({attachments?.length ?? 0})
          </span>
        </h2>
        <span className="text-xs text-slate-400">Append-only · PDF, PNG, JPEG up to 5 MB</span>
      </div>

      {fetchError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {fetchError}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500 text-center py-4">
          Loading attachments...
        </div>
      ) : !attachments || attachments.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          No attachments uploaded yet.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 overflow-hidden">
          {(attachments ?? []).map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 p-2 bg-slate-100 rounded-lg">
                  {getFileIcon(att.mime)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {att.filename}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(att.size)} · Uploaded by{' '}
                    <span className="font-medium text-slate-700">
                      {att.uploader?.name ?? att.uploaderId}
                    </span>{' '}
                    on {new Date(att.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <a
                href={`/api/attachments/${att.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* Upload Form - Available for eligible users (Owner or assigned reviewer) */}
      {canUpload && (
        <form onSubmit={handleUpload} className="pt-4 border-t border-slate-100 space-y-3">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Attach New File
          </label>

          {uploadSuccess && (
            <div
              role="status"
              className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {uploadError && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {clientError && (
            <p className="text-xs text-rose-600">{clientError}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <input
              id="attachment-file-input"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              disabled={uploading}
              className="block text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer cursor-pointer focus:outline-none"
            />

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading...' : 'Upload Attachment'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

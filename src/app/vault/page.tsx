'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/dashboard/Header';
import Footer from '@/components/dashboard/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { DOCUMENT_CATEGORIES } from '@/types';
import type { Document, DocumentCategory } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  legal: 'Legal',
  financial: 'Financial',
  personal: 'Personal',
  correspondence: 'Correspondence',
  court: 'Court',
  other: 'Other',
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const ALLOWED_EXTENSIONS = 'PDF, JPG, PNG, WEBP, DOC, DOCX, TXT';

function getFileTypeLabel(mimeType: string | null): string {
  if (!mimeType) return 'File';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.startsWith('image/')) return 'Image';
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'Doc';
  }
  if (mimeType === 'text/plain') return 'Text';
  return 'File';
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const inputClass =
  'w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-md px-4 py-2.5 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors';

export default function VaultPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | ''>('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [categoryFilter, search]);

  async function fetchDocuments() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    let query = supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (categoryFilter) {
      query = query.eq('category', categoryFilter);
    }
    if (search) {
      query = query.or(`file_name.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      setDocuments((data as Document[]) || []);
    }
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 50MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${user.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      setError('Upload failed. Please try again.');
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        category: uploadCategory || null,
        notes: uploadNotes.trim() || null,
      });

    if (insertError) {
      console.error('Failed to save document:', insertError);
      setError('Failed to save document. Please try again.');
      setUploading(false);
      return;
    }

    setUploadCategory('');
    setUploadNotes('');
    setShowUploadForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
    fetchDocuments();
  }

  async function handleDownload(doc: Document) {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_path, 60);

    if (error || !data?.signedUrl) {
      setError('Failed to download file.');
      return;
    }

    window.open(data.signedUrl, '_blank');
  }

  async function handleDelete(doc: Document) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.storage.from('documents').remove([doc.file_path]);
    await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id)
      .eq('user_id', user.id);

    fetchDocuments();
  }

  async function handleUpdate(
    docId: string,
    updates: { file_name?: string; category?: string | null; notes?: string | null }
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('documents')
      .update(updates)
      .eq('id', docId)
      .eq('user_id', user.id);

    fetchDocuments();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header />

      <main className="px-6">
        <section className="max-w-3xl mx-auto pt-16 sm:pt-20 pb-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
              Vault
            </h1>
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="inline-flex items-baseline gap-2 text-base font-medium border-b border-zinc-900 dark:border-zinc-100 pb-1 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
            >
              {showUploadForm ? 'Cancel' : 'Upload file'}
              {!showUploadForm && <span aria-hidden>→</span>}
            </button>
          </div>
        </section>

        {showUploadForm && (
          <section className="max-w-3xl mx-auto pb-10 border-t border-zinc-200 dark:border-zinc-900 pt-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
                  Category (optional)
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as DocumentCategory | '')}
                  className={inputClass}
                >
                  <option value="">No category</option>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="e.g. Signed agreement from March 2025"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
                  File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-zinc-600 dark:text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-zinc-900 dark:file:border-zinc-100 file:text-sm file:font-medium file:bg-zinc-900 file:text-white dark:file:bg-zinc-100 dark:file:text-zinc-900 hover:file:opacity-80 file:cursor-pointer"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                  Max 50MB. Supported: {ALLOWED_EXTENSIONS}
                </p>
              </div>

              {uploading && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <LoadingSpinner size="sm" />
                  Uploading...
                </div>
              )}
            </div>
          </section>
        )}

        {error && (
          <section className="max-w-3xl mx-auto pb-6">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </section>
        )}

        <section className="max-w-3xl mx-auto pb-8 border-t border-zinc-200 dark:border-zinc-900 pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by filename or notes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass}
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-md px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
            >
              <option value="">All categories</option>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="max-w-3xl mx-auto pb-24">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : documents.length === 0 ? (
            <div className="py-16 border-t border-zinc-200 dark:border-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-400">
                {categoryFilter || search
                  ? 'No documents match your search.'
                  : 'No documents uploaded yet.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-900 border-t border-zinc-200 dark:border-zinc-900">
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function DocumentRow({
  doc,
  onDownload,
  onDelete,
  onUpdate,
}: {
  doc: Document;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onUpdate: (
    docId: string,
    updates: { file_name?: string; category?: string | null; notes?: string | null }
  ) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(doc.file_name);
  const [editCategory, setEditCategory] = useState(doc.category || '');
  const [editNotes, setEditNotes] = useState(doc.notes || '');

  const uploadDate = new Date(doc.uploaded_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleSaveEdit = () => {
    onUpdate(doc.id, {
      file_name: editName.trim() || doc.file_name,
      category: editCategory || null,
      notes: editNotes.trim() || null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="py-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
              Filename
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
              Category
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className={inputClass}
            >
              <option value="">No category</option>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 mb-2">
              Notes
            </label>
            <input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add a note…"
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-5 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 pt-1">
            <button
              onClick={handleSaveEdit}
              className="text-zinc-900 dark:text-zinc-100 border-b border-zinc-900 dark:border-zinc-100 pb-0.5"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="py-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            <span>{getFileTypeLabel(doc.mime_type)}</span>
            {doc.category && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span>{CATEGORY_LABELS[doc.category] ?? doc.category}</span>
              </>
            )}
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 break-all">
            {doc.file_name}
          </p>
          {doc.notes && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {doc.notes}
            </p>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            <span>{uploadDate}</span>
            {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-5 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDownload(doc)}
            className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            Download
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onDelete(doc);
                  setConfirmDelete(false);
                }}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

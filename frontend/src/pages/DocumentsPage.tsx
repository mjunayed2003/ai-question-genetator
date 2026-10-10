import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Search,
  Trash2,
  Sparkles,
  Eye,
  Calendar,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { ConfirmModal } from '../components/ConfirmModal';
import type { Document } from '../types';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  // Deletion state
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View Extracted Text modal
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const fetchDocs = async () => {
    try {
      setIsLoading(true);
      const res = await api.listDocuments(1, 50);
      setDocuments(res.documents);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch documents', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [user]);

  const handleDeleteConfirm = async () => {
    if (!deleteDocId) return;
    try {
      setIsDeleting(true);
      await api.deleteDocument(deleteDocId);
      showToast('Document deleted successfully', 'success');
      setDocuments((prev) => prev.filter((d) => d.id !== deleteDocId));
      setDeleteDocId(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete document', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenTextModal = async (doc: Document) => {
    try {
      // Fetch full document with extracted text if not present
      const fullDoc = await api.getDocument(doc.id);
      setViewingDoc(fullDoc);
    } catch {
      setViewingDoc(doc);
    }
  };

  const handleCopyText = async () => {
    if (!viewingDoc?.extractedText) return;
    try {
      await navigator.clipboard.writeText(viewingDoc.extractedText);
      setCopiedText(true);
      showToast('Copied extracted text to clipboard!', 'success');
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      showToast('Failed to copy text', 'error');
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="page-container container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Study Materials & Documents</h1>
          <p className="page-subtitle">
            {user
              ? `Private workspace for ${user.email} • Only you can view and use your files.`
              : 'Upload textbooks, lecture slides, or exam notes to generate questions.'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsUploadOpen(true)}
        >
          <UploadCloud size={18} />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="filter-bar-row glass-panel">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search documents by file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Documents Grid / Table */}
      {isLoading ? (
        <div className="loading-state-box">
          <span className="loading-spinner-lg" />
          <p>Loading document library...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="empty-state-card glass-panel">
          <FileText size={48} className="text-dim" />
          <h3>No Documents Found</h3>
          <p>
            {searchQuery
              ? 'No documents match your search keyword.'
              : 'Upload educational PDFs or images to start generating questions.'}
          </p>
          <button
            type="button"
            className="btn btn-primary mt-3"
            onClick={() => setIsUploadOpen(true)}
          >
            <UploadCloud size={16} />
            <span>Upload First Document</span>
          </button>
        </div>
      ) : (
        <div className="documents-grid">
          {filteredDocs.map((doc) => {
            const isPdf = doc.mimeType === 'application/pdf';

            return (
              <div key={doc.id} className="doc-card glass-panel">
                <div className="doc-card-top">
                  <div className="doc-type-icon-box">
                    <FileText size={24} className={isPdf ? 'text-rose' : 'text-cyan'} />
                  </div>
                  <span
                    className={`badge ${
                      doc.status === 'PROCESSED'
                        ? 'badge-easy'
                        : doc.status === 'PROCESSING'
                        ? 'badge-medium'
                        : doc.status === 'FAILED'
                        ? 'badge-hard'
                        : 'badge-cyan'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>

                <div className="doc-card-body">
                  <h3 className="doc-card-name" title={doc.originalName}>
                    {doc.originalName}
                  </h3>
                  <div className="doc-card-meta">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>•</span>
                    <span>{isPdf ? 'PDF Document' : 'Image File'}</span>
                  </div>
                </div>

                <div className="doc-card-footer">
                  <div className="doc-date">
                    <Calendar size={13} className="text-dim" />
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="doc-actions-group">
                    {doc.status === 'PROCESSED' && (
                      <button
                        type="button"
                        className="card-quick-btn"
                        title="View Extracted Content"
                        onClick={() => handleOpenTextModal(doc)}
                      >
                        <Eye size={15} />
                      </button>
                    )}

                    <Link
                      to={`/generate?documentId=${doc.id}`}
                      className="card-quick-btn btn-ai"
                      title="Generate questions from this document"
                    >
                      <Sparkles size={15} className="text-cyan" />
                    </Link>

                    <button
                      type="button"
                      className="card-quick-btn text-rose"
                      title="Delete document"
                      onClick={() => setDeleteDocId(doc.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => fetchDocs()}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteDocId !== null}
        title="Delete Document"
        message="Are you sure you want to delete this document? Any question sets previously generated from it will still be preserved."
        confirmLabel="Delete Document"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDocId(null)}
      />

      {/* Extracted Text Modal */}
      {viewingDoc && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setViewingDoc(null)}>
          <div className="modal-dialog modal-lg glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Extracted Document Content</h3>
                <p className="modal-subtitle truncate">{viewingDoc.originalName}</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewingDoc(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {viewingDoc.extractedText ? (
                <div className="extracted-text-view">
                  <pre className="text-content-pre">{viewingDoc.extractedText}</pre>
                </div>
              ) : (
                <div className="empty-state p-4">
                  <p className="text-dim">No extracted text content found for this document.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Link
                to={`/generate?documentId=${viewingDoc.id}`}
                className="btn btn-primary"
                onClick={() => setViewingDoc(null)}
              >
                <Sparkles size={16} />
                <span>Generate Questions Now</span>
              </Link>

              {viewingDoc.extractedText && (
                <button type="button" className="btn btn-secondary" onClick={handleCopyText}>
                  {copiedText ? <Check size={16} className="text-emerald" /> : <Copy size={16} />}
                  <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingDoc(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

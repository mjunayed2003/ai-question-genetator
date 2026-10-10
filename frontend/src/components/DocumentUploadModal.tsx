import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { Document } from '../types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (document: Document) => void;
}

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('Unsupported file type. Please upload a PDF or image (PNG, JPG, WEBP).', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('File size exceeds the 15MB limit.', 'error');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const doc = await api.uploadDocument(selectedFile);
      showToast(`"${selectedFile.name}" uploaded successfully!`, 'success');
      setSelectedFile(null);
      onSuccess(doc);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload document', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Upload Educational Material</h3>
            <p className="modal-subtitle">Upload a syllabus, textbook chapter, or exam notes (PDF or Image)</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isUploading}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {!selectedFile ? (
            <div
              className={`dropzone-box ${dragActive ? 'dropzone-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-icon">
                <UploadCloud size={40} className="text-cyan" />
              </div>
              <p className="dropzone-title">Drag & drop your file here, or click to browse</p>
              <p className="dropzone-hint">Supports PDF, PNG, JPG, JPEG, WEBP (Max 15MB)</p>
            </div>
          ) : (
            <div className="selected-file-card glass-panel">
              <div className="file-info-group">
                <FileText size={28} className="text-cyan" />
                <div className="file-name-meta">
                  <span className="file-name-text">{selectedFile.name}</span>
                  <span className="file-size-text">{formatFileSize(selectedFile.size)}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-remove-file"
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <span className="loading-spinner-sm" />
                <span>Processing & Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                <span>Upload Document</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

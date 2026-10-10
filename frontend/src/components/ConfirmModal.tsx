import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onCancel}>
      <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            {isDangerous && <FiAlertTriangle className="text-rose" size={20} />}
            <h3>{title}</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="text-secondary">{message}</p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${isDangerous ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { FiX, FiCopy, FiCheck, FiDownload, FiPrinter } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';

interface ExportModalProps {
  isOpen: boolean;
  topicTitle: string;
  exportText: string;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  topicTitle,
  exportText,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleDownload = () => {
    const filename = `${(topicTitle || 'Question-Set').toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`, 'success');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up was blocked. Please allow popups to print.', 'warning');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${topicTitle || 'Question Set'}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; color: #111; font-size: 14pt; }
            pre { white-space: pre-wrap; font-family: inherit; font-size: 13pt; }
          </style>
        </head>
        <body>
          <pre>${exportText}</pre>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-dialog modal-lg glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Export Questions</h3>
            <p className="modal-subtitle">Formatted for printing and study sheets</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="export-preview-container">
            <pre className="export-text-area">{exportText}</pre>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <FiCheck size={16} className="text-emerald" /> : <FiCopy size={16} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button type="button" className="btn btn-secondary" onClick={handlePrint}>
            <FiPrinter size={16} />
            <span>Print</span>
          </button>

          <button type="button" className="btn btn-primary" onClick={handleDownload}>
            <FiDownload size={16} />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};

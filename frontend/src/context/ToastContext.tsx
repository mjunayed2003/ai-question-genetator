import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => {
          let icon = <FiInfo className="toast-icon text-cyan" size={18} />;
          if (toast.type === 'success') {
            icon = <FiCheckCircle className="toast-icon text-emerald" size={18} />;
          } else if (toast.type === 'error') {
            icon = <FiAlertCircle className="toast-icon text-rose" size={18} />;
          } else if (toast.type === 'warning') {
            icon = <FiAlertTriangle className="toast-icon text-amber" size={18} />;
          }

          return (
            <div key={toast.id} className={`toast-card toast-${toast.type} animate-fade-in`}>
              <div className="toast-content">
                {icon}
                <span className="toast-message">{toast.message}</span>
              </div>
              <button
                type="button"
                className="toast-close-btn"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
              >
                <FiX size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

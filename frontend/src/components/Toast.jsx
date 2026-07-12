// src/components/Toast.jsx
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Toast.css';

/* ─── Context ─────────────────────────────────── */
const ToastContext = createContext(null);

const DURATION = 4000; // ms before auto-dismiss

const ICON_MAP = {
  success: <CheckCircle2 size={18} />,
  error:   <XCircle      size={18} />,
  warning: <AlertTriangle size={18} />,
  info:    <Info          size={18} />,
};

/* ─── Provider ───────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    // Mark as exiting so CSS animation plays
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
    // Remove after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }, 280);
  }, []);

  const toast = useCallback((message, { type = 'info', title, duration = DURATION } = {}) => {
    const id = Date.now() + Math.random();
    const defaultTitles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };

    setToasts((prev) => [
      ...prev,
      { id, type, title: title ?? defaultTitles[type], message, exiting: false, duration },
    ]);

    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }

    return id;
  }, [dismiss]);

  const toastMethods = React.useMemo(() => {
    const fn = (msg, opts) => toast(msg, opts);
    fn.success = (msg, opts) => toast(msg, { type: 'success', ...opts });
    fn.error   = (msg, opts) => toast(msg, { type: 'error',   ...opts });
    fn.warning = (msg, opts) => toast(msg, { type: 'warning', ...opts });
    fn.info    = (msg, opts) => toast(msg, { type: 'info',    ...opts });
    return fn;
  }, [toast]);

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map(({ id, type, title, message, exiting, duration }) => (
          <div
            key={id}
            className={`toast toast-${type}${exiting ? ' toast-exit' : ''}`}
            role="alert"
          >
            <span className="toast-icon">{ICON_MAP[type]}</span>
            <div className="toast-body">
              {title && <p className="toast-title">{title}</p>}
              <p className="toast-message">{message}</p>
            </div>
            <button className="toast-close" onClick={() => dismiss(id)} aria-label="Dismiss">
              <X size={14} />
            </button>
            {duration > 0 && (
              <div
                className="toast-progress"
                style={{ animationDuration: `${duration}ms` }}
              />
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ─── Hook ───────────────────────────────────── */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export default ToastProvider;

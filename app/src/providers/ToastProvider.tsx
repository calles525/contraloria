// Proveedor de notificaciones tipo toast.
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type TipoToast = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  mensaje: string;
  titulo?: string;
  tipo: TipoToast;
}

interface ToastContextValue {
  mostrar: (mensaje: string, tipo?: TipoToast, titulo?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const iconoSegunTipo: Record<TipoToast, string> = {
  success:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  error:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  warning:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  info:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 11v5m0-8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const contador = useRef(0);

  const quitar = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback(
    (mensaje: string, tipo: TipoToast = 'success', titulo?: string) => {
      const id = ++contador.current;
      setToasts((prev) => [...prev, { id, mensaje, tipo, titulo }]);
      window.setTimeout(() => quitar(id), 4200);
    },
    [quitar],
  );

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`} role="status">
            <span
              className="toast-icon"
              dangerouslySetInnerHTML={{ __html: iconoSegunTipo[t.tipo] }}
            />
            <div className="toast-body">
              {t.titulo ? <div className="toast-title">{t.titulo}</div> : null}
              <div className="toast-message">{t.mensaje}</div>
            </div>
            <button
              type="button"
              className="toast-close"
              aria-label="Cerrar notificación"
              onClick={() => quitar(t.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

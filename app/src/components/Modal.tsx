// Modales reutilizables con soporte de confirmación (promesa) y diálogos.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface ConfirmarOpciones {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligro?: boolean;
}

interface ModalContextValue {
  confirmar: (opciones: ConfirmarOpciones) => Promise<boolean>;
  abrir: (contenido: ReactNode, ancho?: 'md' | 'lg') => CerrarModal;
}

type CerrarModal = () => void;

const ModalContext = createContext<ModalContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal debe usarse dentro de <ModalProvider>');
  return ctx;
}

interface EstadoModal {
  esConfirm: boolean;
  ancho: 'md' | 'lg';
  opciones?: ConfirmarOpciones;
  cuerpo?: ReactNode;
  resolver?: (v: boolean) => void;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<EstadoModal | null>(null);

  const cerrar = useCallback(() => setModal(null), []);

  const confirmar = useCallback(
    (opciones: ConfirmarOpciones) =>
      new Promise<boolean>((resolver) => {
        setModal({ esConfirm: true, ancho: 'md', opciones, resolver });
      }),
    [],
  );

  const abrir = useCallback<ModalContextValue['abrir']>((contenido, ancho = 'lg') => {
    setModal({ esConfirm: false, ancho, cuerpo: contenido });
    return cerrar;
  }, [cerrar]);

  const value = useMemo<ModalContextValue>(() => ({ confirmar, abrir }), [confirmar, abrir]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modal ? (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              if (modal.esConfirm) modal.resolver?.(false);
              setModal(null);
            }
          }}
        >
          <div
            className={`modal ${modal.ancho === 'lg' ? 'modal-lg' : ''}`}
            role="dialog"
            aria-modal="true"
          >
            {modal.esConfirm ? (
              <ConfirmarCuerpo
                opciones={modal.opciones ?? { titulo: '', mensaje: '' }}
                onCancelar={() => {
                  modal.resolver?.(false);
                  setModal(null);
                }}
                onConfirmar={() => {
                  modal.resolver?.(true);
                  setModal(null);
                }}
              />
            ) : (
              modal.cuerpo
            )}
          </div>
        </div>
      ) : null}
    </ModalContext.Provider>
  );
}

function ConfirmarCuerpo({
  opciones,
  onCancelar,
  onConfirmar,
}: {
  opciones: ConfirmarOpciones;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <>
      <div className="modal-head">
        <h3>{opciones.titulo}</h3>
        <button type="button" className="icon-btn modal-close-x" onClick={onCancelar} aria-label="Cerrar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="modal-body">
        <p>{opciones.mensaje}</p>
      </div>
      <div className="modal-foot">
        <button type="button" className="btn btn-outline" onClick={onCancelar}>
          {opciones.textoCancelar ?? 'Cancelar'}
        </button>
        <button
          type="button"
          className={`btn ${opciones.peligro ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirmar}
        >
          {opciones.textoConfirmar ?? 'Confirmar'}
        </button>
      </div>
    </>
  );
}

export function CabeceraModal({ titulo, onCerrar }: { titulo: string; onCerrar: () => void }) {
  return (
    <div className="modal-head">
      <h3>{titulo}</h3>
      <button type="button" className="icon-btn modal-close-x" onClick={onCerrar} aria-label="Cerrar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

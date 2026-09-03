// Línea de tiempo para historial y actividad reciente.
import { ESTADO_COLOR, ESTADOS } from '../lib/constants';
import { formatearFecha } from '../lib/utils';

interface ItemTimeline {
  fecha: string;
  usuarioNombre: string;
  comentario?: string;
  estadoAnterior?: string | null;
  estadoNuevo?: string | null;
}

const COLORES = ['tl-blue', 'tl-green', 'tl-orange', 'tl-purple', 'tl-red'];

export function Timeline({ items }: { items: ItemTimeline[] }) {
  if (!items.length) {
    return <p className="empty-text">Sin registros.</p>;
  }
  return (
    <div className="timeline">
      {items.map((item, idx) => {
        const color = COLORES[idx % COLORES.length];
        return (
          <div className="tl-item" key={idx}>
            <div className={`tl-dot ${color}`} />
            <div className="tl-content">
              <div className="tl-head">
                <span className="tl-title">{item.usuarioNombre}</span>
                <span className="tl-date">{formatearFecha(item.fecha)}</span>
              </div>
              {item.comentario ? <div className="tl-text">{item.comentario}</div> : null}
              {item.estadoAnterior || item.estadoNuevo ? (
                <div className="tl-transition">
                  {item.estadoAnterior ? (
                    <span className="badge badge-slate">
                      {ESTADOS[item.estadoAnterior as keyof typeof ESTADOS] ?? item.estadoAnterior}
                    </span>
                  ) : null}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.estadoNuevo ? (
                    <span
                      className={`badge ${
                        ESTADO_COLOR[item.estadoNuevo as keyof typeof ESTADO_COLOR]
                          ? `badge-${ESTADO_COLOR[item.estadoNuevo as keyof typeof ESTADO_COLOR]}`
                          : 'badge-slate'
                      }`}
                    >
                      {ESTADOS[item.estadoNuevo as keyof typeof ESTADOS] ?? item.estadoNuevo}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

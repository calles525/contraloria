// Componentes de presentación simples: paginación, estados vacíos, spinners y skeletons.
import type { ReactNode } from 'react';

interface PaginacionProps {
  pagina: number;
  totalPages: number;
  total: number;
  inicio: number;
  fin: number;
  tamanoPagina: number;
  onCambiarPagina: (p: number) => void;
  onCambiarTamano?: (n: number) => void;
}

export function Paginacion({
  pagina,
  totalPages,
  total,
  inicio,
  fin,
  tamanoPagina,
  onCambiarPagina,
  onCambiarTamano,
}: PaginacionProps) {
  const numeros: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - pagina) > 1) {
      if (numeros[numeros.length - 1] !== '...') numeros.push('...');
      continue;
    }
    numeros.push(i);
  }

  return (
    <div>
      <div className="table-footer">
        <span className="table-count">
          Mostrando {total === 0 ? 0 : inicio + 1}-{Math.min(fin, total)} de {total}
        </span>
        {onCambiarTamano ? (
          <div className="page-size">
            <label htmlFor="tamPagina">Mostrar</label>
            <select
              id="tamPagina"
              value={tamanoPagina}
              onChange={(e) => onCambiarTamano(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        ) : null}
      </div>
      <div className="pagination">
        <button
          type="button"
          className="pg-btn"
          disabled={pagina <= 1}
          onClick={() => onCambiarPagina(pagina - 1)}
          aria-label="Página anterior"
        >
          &laquo;
        </button>
        {numeros.map((n, idx) =>
          n === '...' ? (
            <span key={`e${idx}`} className="pg-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className={`pg-btn ${n === pagina ? 'pg-active' : ''}`}
              onClick={() => onCambiarPagina(n)}
            >
              {n}
            </button>
          ),
        )}
        <button
          type="button"
          className="pg-btn"
          disabled={pagina >= totalPages}
          onClick={() => onCambiarPagina(pagina + 1)}
          aria-label="Página siguiente"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}

export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  accion,
}: {
  icono?: string;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icono ? (
        <div className="empty-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d={icono} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ) : null}
      <h4>{titulo}</h4>
      {descripcion ? <p>{descripcion}</p> : null}
      {accion ?? null}
    </div>
  );
}

export function Spinner({ etiqueta }: { etiqueta?: string }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" aria-hidden="true" />
      {etiqueta ? <p className="spinner-label">{etiqueta}</p> : null}
    </div>
  );
}

export function FilaSkeleton({ columnas = 5, filas = 5 }: { columnas?: number; filas?: number }) {
  return (
    <div className="skeleton-tabla">
      {Array.from({ length: filas }).map((_, i) => (
        <div className="skeleton-fila" key={i}>
          {Array.from({ length: columnas }).map((__, j) => (
            <div className="skeleton-celda" key={j} />
          ))}
        </div>
      ))}
    </div>
  );
}

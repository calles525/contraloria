import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../providers/AppProvider';
import { useToast } from '../providers/ToastProvider';
import { useModal } from '../components/Modal';
import { store } from '../lib/store';
import { ESTADOS, PRIORIDADES, TIPOS, TIPO_CAMPOS } from '../lib/constants';
import type { CampoEspecifico, Prioridad, Solicitud, TipoSolicitud } from '../lib/types';
import { validarDatosEspecificos, validarDatosGenerales } from '../lib/validation';
import { usePageTitle } from '../hooks/usePageTitle';
import { EstadoBadge } from '../components/Badge';

type Paso = 1 | 2 | 3;

const inputPorTipo: Record<CampoEspecifico['type'], string> = {
  text: 'text',
  number: 'number',
  email: 'email',
  rif: 'text',
  phone: 'text',
  money: 'text',
  date: 'date',
  textarea: 'textarea',
  select: 'select',
};

function TipoInput({
  campo,
  valor,
  onChange,
}: {
  campo: CampoEspecifico;
  valor: string;
  onChange: (v: string) => void;
}) {
  if (campo.type === 'textarea') {
    return <textarea rows={4} value={valor || ''} placeholder={`Ingrese ${campo.label.toLowerCase()}`} onChange={(e) => onChange(e.target.value)} />;
  }
  if (campo.type === 'select') {
    return (
      <select value={valor || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seleccione...</option>
        {campo.options?.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={campo.type === 'number' ? 'number' : inputPorTipo[campo.type] ?? 'text'}
      inputMode={campo.type === 'money' || campo.type === 'number' ? 'decimal' : undefined}
      value={valor || ''}
      placeholder={`Ingrese ${campo.label.toLowerCase()}`}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function NuevaSolicitud() {
  usePageTitle('Nueva Solicitud');
  const { usuario, recargarDatos } = useApp();
  const { mostrar } = useToast();
  const { confirmar } = useModal();
  const navegar = useNavigate();
  const [searchParams] = useSearchParams();

  const editarId = Number(searchParams.get('editar') ?? '0') || 0;
  const editar = editarId ? store.getSolicitud(editarId) : undefined;

  const [paso, setPaso] = useState<Paso>(1);
  const [tipo, setTipo] = useState<TipoSolicitud>(editar?.tipo ?? 'creacion_tercero');
  const [titulo, setTitulo] = useState(editar?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(editar?.descripcion ?? '');
  const [prioridad, setPrioridad] = useState<Prioridad>(editar?.prioridad ?? 'media');
  const [destino, setDestino] = useState<number | ''>(editar?.departamentoDestinoId ?? '');
  const [fechaRequerida, setFechaRequerida] = useState(editar?.fechaRequerida?.slice(0, 10) ?? '');
  const [datos, setDatos] = useState<Record<string, string>>(editar?.datosEspecificos ?? {});
  const [errores, setErrores] = useState<string[]>([]);

  const departamentos = store.getDepartamentos().filter((d) => d.activo);
  const camposTipo = TIPO_CAMPOS[tipo] ?? [];

  // Ayuda contextual por tipo.
  const ayuda = useMemo(
    () =>
      ({
        creacion_tercero: 'Diligencie los datos del tercero. Será validado por el departamento de compras.',
        registro_producto: 'Complete la ficha del producto a registrar en el sistema.',
        solicitud_compra: 'Detalle el bien o servicio y justifique la necesidad de compra.',
        viaticos: 'Indique el destino, fechas y presupuesto estimado del viaje.',
        otro: 'Describa el detalle de su solicitud de forma clara y concisa.',
      })[tipo] ?? '',
    [tipo],
  );

  if (!usuario) return null;

  const validarPaso1 = (): boolean => {
    const errs = validarDatosGenerales({ tipo, titulo, descripcion, prioridad, departamentoDestinoId: destino, fechaRequerida });
    setErrores(errs);
    if (errs.length) return false;
    setErrores([]);
    return true;
  };

  const validarPaso2 = (): boolean => {
    const errs = validarDatosEspecificos(tipo, datos);
    setErrores(errs);
    if (errs.length) return false;
    setErrores([]);
    return true;
  };

  const siguiente = () => {
    if (paso === 1 && !validarPaso1()) return;
    if (paso === 2 && !validarPaso2()) return;
    setPaso((p) => (p + 1) as Paso);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const anterior = () => {
    setErrores([]);
    setPaso((p) => (p - 1) as Paso);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const construirSolicitud = (estadoNuevo: Solicitud['estado']): Solicitud => ({
    id: editar?.id ?? 0,
    numeroSolicitud: editar?.numeroSolicitud ?? '',
    tipo,
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    prioridad,
    fechaRequerida: fechaRequerida || undefined,
    estado: estadoNuevo,
    creadorId: editar?.creadorId ?? usuario.id,
    creadorNombre: editar?.creadorNombre ?? usuario.nombre,
    departamentoOrigenId: editar?.departamentoOrigenId ?? usuario.departamentoId,
    departamentoOrigenNombre: editar?.departamentoOrigenNombre ?? usuario.departamentoNombre,
    departamentoDestinoId: Number(destino),
    departamentoDestinoNombre: store.getDepartamento(Number(destino))?.nombre ?? '',
    asignadoA: editar?.asignadoA ?? null,
    asignadoANombre: editar?.asignadoANombre ?? '',
    fechaCreacion: editar?.fechaCreacion ?? new Date().toISOString(),
    fechaEnvio: editar?.fechaEnvio ?? null,
    fechaRevisionDepartamento: editar?.fechaRevisionDepartamento ?? null,
    fechaAprobacionContraloria: editar?.fechaAprobacionContraloria ?? null,
    fechaFinalizacion: editar?.fechaFinalizacion ?? null,
    datosEspecificos: datos,
    documentos: editar?.documentos ?? [],
    historial: editar?.historial ?? [],
    comentarios: editar?.comentarios ?? [],
    ultimaModificacion: new Date().toISOString(),
    activo: true,
  });

  const guardarBorrador = () => {
    if (!validarPaso1() || !validarPaso2()) {
      setPaso(1);
      mostrar('Revise los campos obligatorios antes de guardar.', 'warning');
      return;
    }
    const nueva = construirSolicitud('borrador');
    const fecha = new Date().toISOString();
    if (editar) {
      store.agregarHistorial(nueva, editar.estado, 'borrador', 'Borrador actualizado.', usuario);
    } else {
      nueva.historial = [{ fecha, usuarioId: usuario.id, usuarioNombre: usuario.nombre, estadoAnterior: null, estadoNuevo: 'borrador', comentario: 'Borrador creado.' }];
    }
    store.guardarSolicitud(nueva);
    recargarDatos();
    mostrar('Borrador guardado correctamente.');
    navegar('/mis-solicitudes');
  };

  const enviar = async () => {
    if (!validarPaso1() || !validarPaso2()) {
      setPaso(1);
      mostrar('Revise los campos obligatorios antes de enviar.', 'warning');
      return;
    }
    const destinoDept = store.getDepartamento(Number(destino));
    if (!destinoDept) return;
    const ok = await confirmar({
      titulo: 'Enviar solicitud',
      mensaje: `¿Confirmar el envío de la solicitud al departamento ${destinoDept.nombre}?`,
      textoConfirmar: 'Enviar',
    });
    if (!ok) return;
    const nueva = construirSolicitud('enviado');
    const fecha = new Date().toISOString();
    if (editar) {
      store.agregarHistorial(nueva, editar.estado, 'enviado', 'Solicitud enviada.', usuario);
    } else {
      nueva.historial = [{ fecha, usuarioId: usuario.id, usuarioNombre: usuario.nombre, estadoAnterior: null, estadoNuevo: 'enviado', comentario: 'Solicitud enviada.' }];
    }
    nueva.fechaEnvio = fecha;
    store.guardarSolicitud(nueva);
    recargarDatos();
    mostrar('Solicitud enviada correctamente.');
    navegar('/mis-solicitudes');
  };

  const desechar = async () => {
    const ok = await confirmar({
      titulo: 'Descartar solicitud',
      mensaje: '¿Desea descartar esta solicitud? Los cambios no guardados se perderán.',
      textoConfirmar: 'Descartar',
      peligro: true,
    });
    if (!ok) return;
    navegar('/mis-solicitudes');
  };

  return (
    <div className="wizard">
      <div className="card">
        <div className="card-head">
          <h3>{editar ? `Editar solicitud ${editar.numeroSolicitud}` : 'Nueva Solicitud'}</h3>
          {editar ? (
            <span className="badge badge-slate">{ESTADOS[editar.estado]}</span>
          ) : (
            <span className="badge badge-primary">Nuevo</span>
          )}
        </div>

        <div className="wizard-steps">
          <div className={`wizard-step ${paso >= 1 ? 'active' : ''}`}>
            <span className="step-num">{paso > 1 ? '✓' : '1'}</span> Datos Generales
          </div>
          <div className={`wizard-step ${paso >= 2 ? 'active' : ''}`}>
            <span className="step-num">{paso > 2 ? '✓' : '2'}</span> Datos Específicos
          </div>
          <div className={`wizard-step ${paso >= 3 ? 'active' : ''}`}>
            <span className="step-num">3</span> Revisión y Envío
          </div>
        </div>

        {paso === 1 && (
          <div className="wizard-body">
            <div className="grid grid-3">
              <div className="form-group">
                <label>Tipo de Solicitud</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoSolicitud)}>
                  {Object.entries(TIPOS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Departamento Destino</label>
                <select value={destino} onChange={(e) => setDestino(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Seleccione...</option>
                  {departamentos.map((d) => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Prioridad</label>
                <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad)}>
                  {Object.entries(PRIORIDADES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Título</label>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Resumen breve de la solicitud" />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describa el detalle y la justificación de la solicitud" />
            </div>
            <div className="form-group">
              <label>Fecha requerida (opcional)</label>
              <input type="date" value={fechaRequerida} onChange={(e) => setFechaRequerida(e.target.value)} />
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="wizard-body">
            <p className="hint">{ayuda}</p>
            <div className="grid grid-2">
              {camposTipo.map((campo) => (
                <div className="form-group" key={campo.key}>
                  <label>{campo.label}{campo.required ? ' *' : ''}</label>
                  <TipoInput campo={campo} valor={datos[campo.key] ?? ''} onChange={(v) => setDatos((d) => ({ ...d, [campo.key]: v }))} />
                </div>
              ))}
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="wizard-body">
            <table className="table detail-table">
              <tbody>
                <tr><th>Tipo</th><td>{TIPOS[tipo]}</td></tr>
                <tr><th>Prioridad</th><td>{PRIORIDADES[prioridad]}</td></tr>
                <tr><th>Destino</th><td>{store.getDepartamento(Number(destino))?.nombre ?? '—'}</td></tr>
                <tr><th>Título</th><td>{titulo}</td></tr>
                <tr><th>Descripción</th><td>{descripcion}</td></tr>
                <tr><th>Fecha requerida</th><td>{fechaRequerida || '—'}</td></tr>
                <tr><th>Estado</th><td><EstadoBadge estado={editar?.estado ?? 'borrador'} /></td></tr>
              </tbody>
            </table>
            <h4 className="section-title">Datos específicos</h4>
            <table className="table detail-table">
              <tbody>
                {camposTipo.map((campo) => (
                  <tr key={campo.key}><th>{campo.label}</th><td>{datos[campo.key] ?? '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {errores.length > 0 ? (
          <div className="alert alert-error">
            <ul>
              {errores.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        ) : null}

        <div className="wizard-actions">
          {paso > 1 ? (
            <button type="button" className="btn btn-outline" onClick={anterior}>Anterior</button>
          ) : (
            <button type="button" className="btn btn-outline" onClick={desechar}>Descartar</button>
          )}
          <div className="grow" />
          {paso < 3 ? (
            <>
              <button type="button" className="btn btn-outline" onClick={guardarBorrador}>Guardar borrador</button>
              <button type="button" className="btn btn-primary" onClick={siguiente}>Continuar</button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-outline" onClick={guardarBorrador}>Guardar borrador</button>
              <button type="button" className="btn btn-success" onClick={enviar}>Enviar Solicitud</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import {
  DepartamentoNotificacion,
  DatosConfiguracionEvolution,
} from '../../types/notificaciones';
import { notificacionesWhatsappApi } from '../../services/notificacionesWhatsapp';
import { notificarError, notificarExito } from '../../utils/sweetalert';

const claseInput =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder-white/30';

/** Interruptor tipo TailAdmin (switch). */
function Interruptor({
  activo,
  cambiar,
  etiqueta,
}: {
  activo: boolean;
  cambiar: (valor: boolean) => void;
  etiqueta: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-gray-700 select-none dark:text-gray-400">
      <span className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={activo}
          onChange={(e) => cambiar(e.target.checked)}
        />
        <span
          className={`block h-6 w-11 rounded-full transition-colors ${
            activo ? 'bg-brand-500' : 'bg-gray-200 dark:bg-white/10'
          }`}
        ></span>
        <span
          className={`shadow-theme-sm absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300 ease-linear ${
            activo ? 'translate-x-full' : 'translate-x-0'
          }`}
        ></span>
      </span>
      {etiqueta}
    </label>
  );
}

export default function Notificaciones() {
  const [cargando, setCargando] = useState(true);
  const [cargandoConfig, setCargandoConfig] = useState(false);
  const [cargandoAsignacion, setCargandoAsignacion] = useState(false);

  // Configuración de Evolution API.
  const [configForm, setConfigForm] = useState<DatosConfiguracionEvolution>({
    url_api: '',
    instancia: '',
    api_key: '',
    activo: true,
  });
  const [configExiste, setConfigExiste] = useState(false);

  // Destinatarios por departamento.
  const [departamentos, setDepartamentos] = useState<DepartamentoNotificacion[]>([]);
  const [departamentoId, setDepartamentoId] = useState<string>('');
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([notificacionesWhatsappApi.obtenerConfiguracion(), notificacionesWhatsappApi.listarDepartamentos()])
      .then(([configuracion, listaDepartamentos]) => {
        if (configuracion) {
          setConfigExiste(true);
          setConfigForm({
            url_api: configuracion.url_api,
            instancia: configuracion.instancia,
            api_key: configuracion.api_key ?? '',
            activo: configuracion.activo,
          });
        }
        setDepartamentos(listaDepartamentos);
      })
      .catch(() => notificarError('No se pudo cargar la configuración de notificaciones.'))
      .finally(() => setCargando(false));
  }, []);

  const departamentoActual = useMemo(
    () => departamentos.find((d) => String(d.id) === departamentoId) ?? null,
    [departamentos, departamentoId]
  );

  function seleccionarDepartamento(id: string) {
    setDepartamentoId(id);
    const departamento = departamentos.find((d) => String(d.id) === id);
    setSeleccionados(
      new Set((departamento?.usuarios ?? []).filter((u) => u.asignado).map((u) => u.user_id))
    );
  }

  function alternarUsuario(userId: number, activo: boolean) {
    setSeleccionados((actual) => {
      const nuevo = new Set(actual);
      if (activo) nuevo.add(userId);
      else nuevo.delete(userId);
      return nuevo;
    });
  }

  const asignacionOriginal = useMemo(
    () => new Set((departamentoActual?.usuarios ?? []).filter((u) => u.asignado).map((u) => u.user_id)),
    [departamentoActual]
  );

  const sinCambios = useMemo(() => {
    if (!departamentoActual) return true;
    if (seleccionados.size !== asignacionOriginal.size) return false;
    for (const id of seleccionados) {
      if (!asignacionOriginal.has(id)) return false;
    }
    return true;
  }, [seleccionados, asignacionOriginal, departamentoActual]);

  async function guardarConfiguracion(e: React.FormEvent) {
    e.preventDefault();

    const url = configForm.url_api.trim();
    if (!url) {
      notificarError('La URL de la API de Evolution es obligatoria.');
      return;
    }
    if (!/^https?:\/\/.+/.test(url)) {
      notificarError('La URL de la API debe empezar por http:// o https://.');
      return;
    }
    if (!configForm.instancia.trim()) {
      notificarError('El nombre de la instancia es obligatorio.');
      return;
    }

    setCargandoConfig(true);
    try {
      await notificacionesWhatsappApi.guardarConfiguracion({
        url_api: url,
        instancia: configForm.instancia.trim(),
        api_key: (configForm.api_key ?? '').trim() || null,
        activo: configForm.activo,
      });
      setConfigExiste(true);
      notificarExito('Configuración de Evolution guardada correctamente.');
    } catch {
      notificarError('No se pudo guardar la configuración de Evolution.');
    } finally {
      setCargandoConfig(false);
    }
  }

  async function guardarAsignacion() {
    if (!departamentoActual) return;

    setCargandoAsignacion(true);
    try {
      await notificacionesWhatsappApi.guardarUsuariosDepartamento(
        departamentoActual.id,
        [...seleccionados]
      );
      setDepartamentos((actual) =>
        actual.map((d) =>
          d.id === departamentoActual.id
            ? {
                ...d,
                usuarios: d.usuarios.map((u) => ({ ...u, asignado: seleccionados.has(u.user_id) })),
              }
            : d
        )
      );
      notificarExito('Destinatarios de WhatsApp actualizados.');
    } catch {
      notificarError('No se pudieron guardar los destinatarios de WhatsApp.');
    } finally {
      setCargandoAsignacion(false);
    }
  }

  if (cargando) {
    return (
      <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* ---------------------------------------------------------------- */}
        {/* Configuración de la API de Evolution                              */}
        {/* ---------------------------------------------------------------- */}
        <div className="col-span-12 xl:col-span-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="mb-6">
              <h2 className="text-title-md font-semibold text-gray-800 dark:text-white/90">
                API de Evolution
              </h2>
              <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                Guarde el enlace (URL) y la instancia de la API de Evolution para enviar los
                mensajes de WhatsApp del sistema.
              </p>
            </div>

            <form onSubmit={guardarConfiguracion} className="flex flex-col gap-4">
              {!configExiste && (
                <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-theme-sm text-warning-600 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-500">
                  Todavía no hay configuración guardada: los mensajes de WhatsApp no se enviarán.
                </div>
              )}

              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
                  URL de la API <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={configForm.url_api}
                  onChange={(e) => setConfigForm((f) => ({ ...f, url_api: e.target.value }))}
                  placeholder="https://api.evolution.local:8080"
                  className={claseInput}
                />
              </div>

              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
                  Nombre de la instancia <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={configForm.instancia}
                  onChange={(e) => setConfigForm((f) => ({ ...f, instancia: e.target.value }))}
                  placeholder="Contraloria"
                  className={claseInput}
                />
              </div>

              <div>
                <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
                  Clave de la API (apikey) <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="password"
                  value={configForm.api_key ?? ''}
                  onChange={(e) => setConfigForm((f) => ({ ...f, api_key: e.target.value }))}
                  placeholder="••••••••"
                  className={claseInput}
                />
              </div>

              <Interruptor
                activo={configForm.activo ?? true}
                cambiar={(valor) => setConfigForm((f) => ({ ...f, activo: valor }))}
                etiqueta="Envío de WhatsApp activado"
              />

              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={cargandoConfig}
                  className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-700 disabled:opacity-60"
                >
                  {cargandoConfig ? 'Guardando…' : 'Guardar configuración'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Destinatarios de WhatsApp por departamento                         */}
        {/* ---------------------------------------------------------------- */}
        <div className="col-span-12 xl:col-span-7">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="mb-6">
              <h2 className="text-title-md font-semibold text-gray-800 dark:text-white/90">
                Destinatarios de WhatsApp
              </h2>
              <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                Elija un departamento y marque qué usuarios recibirán un mensaje de WhatsApp cuando
                llegue una solicitud dirigida a su departamento.
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
                Departamento
              </label>
              <select
                value={departamentoId}
                onChange={(e) => seleccionarDepartamento(e.target.value)}
                className={claseInput}
              >
                <option value="">Seleccione un departamento</option>
                {departamentos.map((departamento) => (
                  <option key={departamento.id} value={String(departamento.id)}>
                    {departamento.name}
                  </option>
                ))}
              </select>
            </div>

            {!departamentoActual && (
              <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                Seleccione un departamento para ver sus usuarios y asignar destinatarios.
              </p>
            )}

            {departamentoActual && (
              <>
                {departamentoActual.usuarios.length === 0 ? (
                  <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                    Este departamento no tiene usuarios con cuenta en el sistema.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {departamentoActual.usuarios.map((usuario) => (
                      <li
                        key={usuario.user_id}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                            {usuario.user_name}
                          </p>
                          <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                            @{usuario.username}
                            {usuario.phone
                              ? ` · ${usuario.phone}`
                              : ' · Sin teléfono registrado'}
                          </p>
                        </div>
                        {!usuario.phone ? (
                          <span className="rounded-full bg-warning-50 px-3 py-1 text-theme-xs font-medium text-warning-600 dark:bg-warning-500/10 dark:text-warning-500">
                            Sin teléfono
                          </span>
                        ) : (
                          <Interruptor
                            activo={seleccionados.has(usuario.user_id)}
                            cambiar={(valor) => alternarUsuario(usuario.user_id, valor)}
                            etiqueta=""
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex items-center justify-between gap-4 border-t border-gray-100 pt-4 dark:border-white/[0.05]">
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                    {seleccionados.size}{' '}
                    {seleccionados.size === 1 ? 'destinatario seleccionado' : 'destinatarios seleccionados'}
                  </p>
                  <button
                    type="button"
                    onClick={guardarAsignacion}
                    disabled={cargandoAsignacion || sinCambios}
                    className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-700 disabled:opacity-60"
                  >
                    {cargandoAsignacion ? 'Guardando…' : 'Guardar asignación'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
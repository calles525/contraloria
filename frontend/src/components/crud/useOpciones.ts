import { useEffect, useState } from 'react';
import { OpcionSelect } from '../../types/maestros';
import { CampoFormulario } from '../../types/crud';
import api from '../../services/api';

/**
 * Hook que agrupa la lógica de carga de opciones de un formulario,
 * resolviendo selects estáticos y dinámicos (con cascadas).
 */
export function useOpciones(campos: CampoFormulario[]) {
  // Claves estáticas: sus opciones ya vienen definidas en el campo.
  const clavesEstaticas = campos
    .filter((campo) => campo.tipo === 'select' && campo.opciones)
    .map((campo) => campo.nombre);

  // Claves dinámicas: sus opciones se cargan vía cargarOpciones.
  const clavesDinamicas = campos
    .filter((campo) => campo.tipo === 'select' && campo.cargarOpciones)
    .map((campo) => campo.nombre);

  const [opciones, setOpciones] = useState<Record<string, OpcionSelect[]>>({});
  const [cargandoClaves, setCargandoClaves] = useState<string[]>(clavesDinamicas);

  useEffect(() => {
    clavesDinamicas.forEach(async (clave) => {
      const campo = campos.find((c) => c.nombre === clave);
      if (!campo?.cargarOpciones) return;
      try {
        const lista = await campo.cargarOpciones({});
        setOpciones((actual) => ({ ...actual, [clave]: lista }));
      } catch {
        // Silencioso: se mostrará vacío.
      } finally {
        setCargandoClaves((actual) => actual.filter((k) => k !== clave));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Actualiza opciones dinámicas cuando cambia un campo del que dependen.
   */
  async function recargarDependientes(
    campoDependiente: string,
    valores: Record<string, unknown>
  ) {
    const dependientes = campos
      .filter((campo) => campo.cargarOpciones && campo.dependeDe === campoDependiente)
      .map((campo) => campo.nombre);

    await Promise.all(
      dependientes.map(async (clave) => {
        const campo = campos.find((c) => c.nombre === clave);
        if (!campo?.cargarOpciones) return;
        // Limpia el valor de la clave dependiente para forzar re-selección.
        if (campo.dependeDe) {
          setOpciones((actual) => ({ ...actual, [clave]: [] }));
        }
        try {
          const lista = await campo.cargarOpciones(valores);
          setOpciones((actual) => ({ ...actual, [clave]: lista }));
        } catch {
          setOpciones((actual) => ({ ...actual, [clave]: [] }));
        }
      })
    );
  }

  function opcionesDe(campo: CampoFormulario): OpcionSelect[] {
    if (campo.opciones) return campo.opciones;
    return opciones[campo.nombre] || [];
  }

  return {
    opcionesDe,
    recargarDependientes,
    cargandoClaves,
    clavesDinamicas,
    clavesEstaticas,
  };
}

/** Lista todos los registros de un recurso desde la API. */
export async function listarRecurso(rutaApi: string): Promise<Record<string, any>[]> {
  const { data } = await api.get<{ data: any[] }>(rutaApi);
  return data.data;
}
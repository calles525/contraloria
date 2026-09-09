import Swal from 'sweetalert2';

// Preferencias visuales coherentes con la paleta TailAdmin.
const opcionesBase = {
  buttonsStyling: false,
  customClass: {
    confirmButton:
      'inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-700',
    cancelButton:
      'ml-3 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
    popup:
      'rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
    title: 'text-title-sm font-bold text-gray-800 dark:text-white/90',
    htmlContainer: 'text-theme-sm text-gray-500 dark:text-gray-400',
  },
};

/** Muestra un diálogo de confirmación y devuelve true si el usuario acepta. */
export async function confirmarEliminacion(
  titulo: string,
  texto: string
): Promise<boolean> {
  const resultado = await Swal.fire({
    ...opcionesBase,
    title: titulo,
    text: texto,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar',
  });
  return resultado.isConfirmed;
}

/** Muestra un aviso de éxito (toast). */
export function notificarExito(mensaje: string) {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: mensaje,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
}

/** Muestra un aviso de error (ventana centrada). */
export function notificarError(mensaje: string) {
  Swal.fire({
    ...opcionesBase,
    title: 'Error',
    text: mensaje,
    icon: 'error',
    confirmButtonText: 'Entendido',
  });
}
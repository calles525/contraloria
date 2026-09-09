import { useSesion } from '../providers/SesionProvider';

export default function Dashboard() {
  const { usuario } = useSesion();

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-title-md font-bold text-gray-800 dark:text-white/90">
            Panel principal
          </h1>
          <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
            Resumen del Sistema de Contraloría.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h2 className="text-title-sm font-bold text-gray-800 dark:text-white/90">
            Bienvenido, {usuario?.person.first_name} {usuario?.person.last_name}
          </h2>
          <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
            Encargado del departamento de Contraloría.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-theme-sm text-gray-500 dark:text-gray-400">Cédula</p>
              <p className="mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {usuario?.person.id_number}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-theme-sm text-gray-500 dark:text-gray-400">Teléfono</p>
              <p className="mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {usuario?.person.phone || '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-theme-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
                {usuario?.email || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
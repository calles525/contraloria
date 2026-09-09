export default function BadgeActivo({ activo }: { activo: boolean | number }) {
  const esActivo = activo === true || activo === 1;

  if (esActivo) {
    return (
      <span className="inline-flex items-center rounded-full bg-success-50 px-2.5 py-1 text-theme-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
        Activo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-error-50 px-2.5 py-1 text-theme-xs font-medium text-error-600 dark:bg-error-500/15 dark:text-error-500">
      Inactivo
    </span>
  );
}
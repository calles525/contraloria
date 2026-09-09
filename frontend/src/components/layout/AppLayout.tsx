import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from '../ui/ErrorBoundary';

export default function AppLayout() {
  const [colapsado, setColapsado] = useState(false);
  const [movilAbierto, setMovilAbierto] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar
        colapsado={colapsado}
        movilAbierto={movilAbierto}
        alCerrarMovil={() => setMovilAbierto(false)}
      />

      <div className="flex w-full flex-1 flex-col">
        <Header
          colapsado={colapsado}
          movilAbierto={movilAbierto}
          alAlternarColapsado={() => setColapsado((anterior) => !anterior)}
          alAlternarMovil={() => setMovilAbierto((anterior) => !anterior)}
        />

        <main className="custom-scrollbar h-full overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-screen-2xl">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Overlay para móvil */}
      {movilAbierto && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setMovilAbierto(false)}
        />
      )}
    </div>
  );
}
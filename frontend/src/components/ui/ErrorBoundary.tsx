import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface Estado {
  error: Error | null;
}

/**
 * Limite de errores: si un componente hijo lanza un error durante el render,
 * muestra el mensaje en pantalla en lugar de dejar la aplicación en blanco.
 */
export default class ErrorBoundary extends Component<Props, Estado> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): Estado {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-900">
          <div className="w-full max-w-xl rounded-2xl border border-error-200 bg-white p-6 dark:border-error-500/20 dark:bg-gray-900">
            <h1 className="text-title-sm font-bold text-error-600 dark:text-error-500">
              Ocurrió un error inesperado
            </h1>
            <p className="text-theme-sm mt-2 text-gray-600 dark:text-gray-400">
              {this.state.error.message}
            </p>
            <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-gray-100 p-3 text-theme-xs text-gray-700 dark:bg-white/[0.05] dark:text-gray-300">
              {this.state.error.stack}
            </pre>
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null });
              }}
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
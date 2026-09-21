import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { useSesion } from '../providers/SesionProvider';
import logo from '../assets/image/grupo_botalon.jpg';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const { iniciarSesion } = useSesion();

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Ingrese usuario y contraseña.');
      return;
    }

    setCargando(true);
    try {
      const data = await login(username, password);
      iniciarSesion(data.token);
      navigate('/');
    } catch (err: any) {
      const mensaje = err.response?.data?.message || 'Error al iniciar sesión.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] md:p-8">
        <div className="mb-6 text-center">
          <img src={logo} alt="Logo" className="mx-auto h-30" />
          <h1 className="text-title-md font-bold text-gray-800 dark:text-white/90">
            Sistema de Contraloría
          </h1>
          <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
            Inicie sesión para continuar
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/15 dark:text-error-500">
            {error}
          </div>
        )}

        <form onSubmit={manejarEnvio} className="space-y-4">
          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="usuario"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
            />
          </div>

          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-700 disabled:opacity-60"
          >
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

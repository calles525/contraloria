import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../providers/AppProvider';
import { useToast } from '../providers/ToastProvider';
import { store } from '../lib/store';
import { ROLES } from '../lib/constants';
import { Avatar } from '../components/Badge';

export default function Login() {
  const { login } = useApp();
  const { mostrar } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const intentarLogin = (correo: string, clave: string) => {
    const usuario = login(correo, clave);
    if (!usuario) {
      setError('Credenciales inválidas o usuario inactivo.');
      return;
    }
    setError('');
    mostrar(`Bienvenido, ${usuario.nombre.split(' ')[0]}.`, 'success');
    navigate('/dashboard');
  };

  const alEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    intentarLogin(email, password);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m5.6 2A7.6 7.6 0 1111 6.4a7.6 7.6 0 018.6 5.6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1>SIGID</h1>
        </div>
        <h2 className="login-title">Bienvenido de nuevo</h2>
        <p className="login-subtitle">Ingresa a tu cuenta del sistema de solicitudes</p>

        <form onSubmit={alEnviar} noValidate>
          <div className="form-group">
            <label htmlFor="loginEmail">Email</label>
            <input
              id="loginEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@departamento.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="loginPassword">Contraseña</label>
            <input
              id="loginPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              autoComplete="current-password"
              required
            />
          </div>
          {error ? <p className="login-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary w-full">
            Iniciar Sesión
          </button>
        </form>

        <div className="login-demo">
          <p>
            Cuentas de demostración (contraseña: <strong>1234</strong>):
          </p>
          <div className="demo-users">
            {store
              .getUsuarios()
              .filter((u) => u.activo)
              .map((u) => (
                <button
                  type="button"
                  key={u.id}
                  className="demo-user"
                  onClick={() => intentarLogin(u.email, '1234')}
                >
                  <Avatar nombre={u.nombre} id={u.id} tamano="sm" />
                  <span>
                    {u.nombre}
                    <small>{ROLES[u.rol]}</small>
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

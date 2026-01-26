import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { getCurrentUser } from '../services/auth';
import logoHome from '../assets/GranbanLogoIcon.svg';
import '../style/Login.css';
import loginConcept from'../assets/LoginConcept.jpg';
import UserIcon from '../assets/UserIconLogin.svg';
import PasswordIcon from '../assets/PasswordIconLogin.svg';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/Granban';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Se já estiver logado, não precisa ver a tela de login.
    if (getCurrentUser()) navigate('/Granban', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ identifier, password });
      navigate(from, { replace: true });
    } catch (err) {
      const message = err?.message || 'Erro ao fazer login';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="nav-login">
        <img src={logoHome} width="30px" alt="Granban Logo" />Granban, o Kanban para devs

      </div>

      <div className="login-container">
        <div className="login-left">
          {error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="login-form">
            <h1>Login</h1>
            <div className="mb-3">
              <label className="form-label">
                <img src={UserIcon} alt="" /> email ou usuário
              </label>
              <input
                className="login-input"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                <img src={PasswordIcon} alt="" /> senha
              </label>
              <input
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="check-connected">
              <input type="checkbox" /> Me mantenha conectado
            </div>
            <button
              type="submit"
              className="button-login"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="bottom-login">
              Não tenho uma conta. <Link to="/cadastro">Cadastrar</Link>
            </div>
          </form>
        </div>
        <div className="login-right">
          <img src={loginConcept} alt="Imagem ilustração Granban" />
        </div>
      </div>
    </>
  );
}
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createAccount } from '../services/auth';
import { logout } from '../services/auth';
import logoHome from '../assets/GranbanLogoIcon.svg';
import '../style/Login.css';
import registerConcept from'../assets/RegisterConcept.jpg';
import UserIcon from '../assets/UserIconLogin.svg';
import NicknameIcon from '../assets/NicknameIcon.svg';
import EmailIconLogin from '../assets/EmailIconLogin.svg';
import PasswordIcon from '../assets/PasswordIconLogin.svg';


export default function Cadastro() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createAccount({ name, username, email, password });
      // Cadastro autentica o usuário automaticamente no Firebase.
      // Como você pediu para ir para o login, desloga e redireciona.
      await logout();
      navigate('/login');
    } catch (err) {
      const message = err?.message || 'Erro ao cadastrar';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="nav-login">
        <img src={logoHome} width="32px" alt="Granban Logo" />Granban, o Kanban para devs {'</>'}
      </div>

      <div className="cadastro-container">
        <div className="cadastro-left">
          <img src={registerConcept} alt="Imagem ilustração Granban" />
        </div>
        <div className="cadastro-right">
          <h1>Cadastro</h1>

          {error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="cadastro-form">
            <div className="mb-3">
              <label className="form-label">
                <img src={UserIcon} alt="" /> nome
              </label>
              <input
                className="login-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                <img src={NicknameIcon} alt="" /> nome de usuário
              </label>
              <input
                className="login-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                <img src={EmailIconLogin} alt="" /> e-mail
              </label>
              <input
                className="login-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
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
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="check-connected">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
              />
              <span>
                Li e aceito os <span className="terms-link">termos de uso</span>
              </span>
            </div>

            <button
              type="submit"
              className="button-login"
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>

            <div className="bottom-login">
              Já tem uma conta? <Link to="/login">Ir para login</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

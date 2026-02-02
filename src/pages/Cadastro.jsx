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
import InfoIcon from '../assets/InfoIcon.svg';


export default function Cadastro() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showNameInfo, setShowNameInfo] = useState(false);
  const [showEmailInfo, setShowEmailInfo] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
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
            <div className="mb-3 form-field-with-info">
              <label className="form-label">
                <img src={UserIcon} alt="" /> nome de exibição
                <button
                  type="button"
                  className="info-icon-btn"
                  onMouseEnter={() => setShowNameInfo(true)}
                  onMouseLeave={() => setShowNameInfo(false)}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowNameInfo(!showNameInfo);
                  }}
                  aria-label="Informação sobre nome de exibição"
                >
                  <img src={InfoIcon} alt="" className="info-icon" />
                </button>
              </label>
              {showNameInfo && (
                <div className="info-tooltip">
                  <div className="info-tooltip-arrow"></div>
                  <strong>Atenção:</strong> O nome de exibição é público e será visível para outros usuários. 
                  Não use seu nome verdadeiro completo. Prefira usar um apelido ou nome artístico.
                </div>
              )}
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
                <img src={NicknameIcon} alt="" /> usuário
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

            <div className="mb-3 form-field-with-info">
              <label className="form-label">
                <img src={EmailIconLogin} alt="" /> e-mail
                <button
                  type="button"
                  className="info-icon-btn"
                  onMouseEnter={() => setShowEmailInfo(true)}
                  onMouseLeave={() => setShowEmailInfo(false)}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowEmailInfo(!showEmailInfo);
                  }}
                  aria-label="Informação sobre e-mail"
                >
                  <img src={InfoIcon} alt="" className="info-icon" />
                </button>
              </label>
              {showEmailInfo && (
                <div className="info-tooltip">
                  <div className="info-tooltip-arrow"></div>
                  <strong>Aviso de Segurança:</strong> Este é um sistema experimental e pode estar sujeito a problemas de segurança. 
                  Recomendamos usar um e-mail secundário ou menos importante para seu cadastro.
                </div>
              )}
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

            <div className="mb-3">
              <label className="form-label">
                <img src={PasswordIcon} alt="" /> confirmar senha
              </label>
              <input
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

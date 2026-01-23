import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createAccount } from '../services/auth';
import { logout } from '../services/auth';

export default function Cadastro() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="container" style={{ maxWidth: 520, paddingTop: 40 }}>
      <h1 className="h3 mb-3">Cadastro</h1>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="card p-3">
        <div className="mb-3">
          <label className="form-label">Nome</label>
          <input
            className="form-control"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Nome de usuário</label>
          <input
            className="form-control"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <div className="form-text">Você vai poder entrar com ele ou com o e-mail.</div>
        </div>

        <div className="mb-3">
          <label className="form-label">E-mail</label>
          <input
            className="form-control"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Senha</label>
          <div className="input-group">
            <input
              className="form-control"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.88 5.5A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a18.02 18.02 0 0 1-3.34 4.28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.1 6.1C3.55 8 2 12 2 12s3.5 7 10 7c1.34 0 2.58-.3 3.7-.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <div className="form-text">Mínimo 6 caracteres (Firebase Auth).</div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>

        <div className="mt-3">
          <span>Já tem conta? </span>
          <Link to="/login">Ir para login</Link>
        </div>
      </form>
    </div>
  );
}

import logo from '../../assets/GranbanlogoIcon.svg'
import '../../style/Navbar.css'
import Avatar from './Avatar.jsx';
import SearchBar from './SearchBar.jsx';

export function Navbar() {
  return (
    <nav className="navbar-granban">
      <div className="navbar-container">
        {/* Esquerda: logo + links */}
        <div className="navbar-left">
          <div className="navbar-brand">
            <img src={logo} alt="Granban Logo" className="navbar-logo" />
            <span className="navbar-title">Granban</span>
          </div>

          <ul className="navbar-menu">
            <li><a href="/" className="navbar-link">Início</a></li>
            <li><a href="/granban" className="navbar-link">Granban</a></li>
            <li><a href="/projetos" className="navbar-link">Projetos</a></li>
          </ul>
        </div>

        {/* Direita: busca + avatar */}
        <div className="d-flex align-items-center gap-3">
          <SearchBar />
          <Avatar />
        </div>

      </div>
    </nav>
  );
}
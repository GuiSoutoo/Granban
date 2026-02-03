import { useState } from 'react';
import logo from '../../assets/GranbanLogoIcon.svg'
import DropmenuIcon from '../../assets/DropmenuIcon.svg'
import ConfigIcon from '../../assets/ConfigIcon.svg'
import '../../style/Navbar.css'
import Avatar from './Avatar.jsx';
import { NavLink } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Início', end: true },
  { to: '/Granban', label: 'Granban' },
  { to: '/Projetos', label: 'Projetos' }
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggleMenu = () => setIsMenuOpen((prev) => !prev);
  const handleCloseMenu = () => setIsMenuOpen(false);

  return (
    <nav className="navbar-granban">
      <div className="navbar-container">
        <div className="navbar-row">
          <div className="navbar-left">
            <div className="navbar-brand">
              <img src={logo} alt="Granban Logo" className="navbar-logo" />
              <span className="navbar-title">Granban</span>
            </div>

            <ul className="navbar-menu desktop-menu">
        {navLinks.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `navbar-link${isActive ? ' active' : ''}`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
            </ul>
          </div>

          <div className="navbar-actions">
            <button
              type="button"
              className={`navbar-toggle${isMenuOpen ? ' is-open' : ''}`}
              aria-label="Abrir menu"
              onClick={handleToggleMenu}
            >
              <img src={DropmenuIcon} alt="Menu" />
            </button>
            <NavLink
              to="/configuracoes"
              className="navbar-config"
              aria-label="Configurações"
              title="Configurações"
            >
              <img src={ConfigIcon} alt="" />
            </NavLink>
            <Avatar />
          </div>
        </div>

        <ul className={`navbar-menu mobile-menu${isMenuOpen ? ' is-open' : ''}`}>
          {navLinks.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `navbar-link${isActive ? ' active' : ''}`
                }
                onClick={handleCloseMenu}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

      </div>
    </nav>
  );
}
import logo from '../../assets/GranbanlogoIcon.svg'
import '../../style/Navbar.css'
import Avatar from './Avatar.jsx';
import SearchBar from './SearchBar.jsx';
import { NavLink } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Início', end: true },
  { to: '/Granban', label: 'Granban' },
  { to: '/projetos', label: 'Projetos' }
];

export function Navbar() {
  return (
    <nav className="navbar-granban">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-brand">
            <img src={logo} alt="Granban Logo" className="navbar-logo" />
            <span className="navbar-title">Granban</span>
          </div>

          <ul className="navbar-menu">
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

        <div className="d-flex align-items-center gap-3">
          <SearchBar />
          <Avatar />
        </div>

      </div>
    </nav>
  );
}
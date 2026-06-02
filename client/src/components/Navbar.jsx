import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, quota } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  const remaining = quota?.remaining ?? 0;
  const total     = quota?.quota    ?? 30;
  const pct       = Math.round((remaining / total) * 100);
  const barColor  = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <header className="bg-navy-900 text-white sticky top-0 z-50 border-b border-navy-700">
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link
          to="/textes"
          className="font-serif text-lg font-semibold tracking-wide text-amber-300 hover:text-amber-400 transition-colors"
        >
          Revision1G3
          <span className="ml-2 text-xs font-sans font-normal text-navy-200 hidden sm:inline">
            Français · 1ère Générale
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6 text-sm">
          {user && (
            <>
              <Link
                to="/textes"
                className={`transition-colors hover:text-amber-300 ${location.pathname === '/textes' ? 'text-amber-300' : 'text-navy-100'}`}
              >
                Programme
              </Link>
              <Link
                to="/textes-classe"
                className={`transition-colors hover:text-amber-300 ${location.pathname === '/textes-classe' ? 'text-amber-300' : 'text-navy-100'}`}
              >
                Espace Classe
              </Link>
              <Link
                to="/mes-textes"
                className={`transition-colors hover:text-amber-300 ${location.pathname === '/mes-textes' ? 'text-amber-300' : 'text-navy-100'}`}
              >
                Mes Textes
              </Link>
              <Link
                to="/creer-texte"
                className="bg-amber-500 hover:bg-amber-600 text-navy-950 font-semibold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 text-xs"
              >
                <span>➕</span> Créer
              </Link>

              {/* Quota indicator */}
              <div
                className="flex items-center gap-2 text-xs text-navy-200"
                title={`${remaining} message${remaining !== 1 ? 's' : ''} restant${remaining !== 1 ? 's' : ''} aujourd'hui`}
              >
                <div className="w-16 h-1.5 bg-navy-700 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                <span className="tabular-nums">{remaining}/{total}</span>
              </div>

              <button
                onClick={handleLogout}
                className="text-navy-300 hover:text-white transition-colors text-sm ml-2"
              >
                Déconnexion
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        {user && (
          <button
            className="sm:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-navy-700 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        )}
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && user && (
        <div className="sm:hidden border-t border-navy-700 bg-navy-900 px-4 py-3 space-y-3 text-sm fade-up">
          <Link
            to="/textes"
            className="block text-navy-100 hover:text-amber-300 transition-colors py-2"
            onClick={() => setMenuOpen(false)}
          >
            Textes du programme
          </Link>
          <Link
            to="/textes-classe"
            className="block text-navy-100 hover:text-amber-300 transition-colors py-2"
            onClick={() => setMenuOpen(false)}
          >
            Espace Classe
          </Link>
          <Link
            to="/mes-textes"
            className="block text-navy-100 hover:text-amber-300 transition-colors py-2"
            onClick={() => setMenuOpen(false)}
          >
            Mes textes
          </Link>
          <Link
            to="/creer-texte"
            className="block text-amber-300 hover:text-amber-400 font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            ➕ Créer un texte
          </Link>

          {/* Quota mobile */}
          <div className="flex items-center gap-3 py-2 text-navy-200">
            <div className="flex-1 h-1.5 bg-navy-700 rounded-full overflow-hidden">
              <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs tabular-nums">{remaining}/{total} messages</span>
          </div>

          <button
            onClick={handleLogout}
            className="block w-full text-left text-navy-300 hover:text-white transition-colors py-2 border-t border-navy-700 mt-1 pt-3"
          >
            Déconnexion
          </button>
        </div>
      )}
    </header>
  );
}

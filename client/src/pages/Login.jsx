import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login }             = useAuth();
  const navigate              = useNavigate();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', form);
      login(res.data.token, res.data.username);
      navigate('/textes');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Panneau gauche : branding — masqué sur mobile ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 bg-navy-900 text-white flex-col justify-between px-12 xl:px-14 py-12">
        <div>
          <div className="mb-14">
            <p className="font-serif text-2xl font-bold text-amber-300 tracking-wide">Revision1G3</p>
            <p className="text-navy-200 text-sm mt-1">Français · Première Générale</p>
          </div>
          <blockquote>
            <p className="font-serif text-2xl xl:text-3xl font-medium text-white leading-relaxed italic">
              "La lecture est un voyage que l'on fait sans quitter son fauteuil."
            </p>
            <footer className="mt-5 text-navy-300 text-sm">— Proverbe littéraire</footer>
          </blockquote>
        </div>
        <div className="pt-6 border-t border-navy-700 text-navy-400 text-xs">
          Accès réservé aux élèves de la classe
        </div>
      </div>

      {/* ── Formulaire — plein écran sur mobile ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10 bg-parchment-100 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md fade-up">

          {/* Logo mobile uniquement */}
          <div className="lg:hidden mb-8 text-center">
            <p className="font-serif text-2xl font-bold text-navy-900">Revision1G3</p>
            <p className="text-ink-light text-sm mt-1">Français · Première Générale</p>
          </div>

          <div className="mb-7">
            <h1 className="font-serif text-3xl font-bold text-ink">Content de te revoir !</h1>
            <p className="text-ink-light mt-2 text-sm">Connecte-toi pour accéder à tes fiches.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="username">
                Pseudo
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                className="field"
                placeholder="ton pseudo"
                value={form.username}
                onChange={set('username')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="field"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                required
              />
            </div>

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full text-base mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Connexion…
                </span>
              ) : 'Se connecter'}
            </button>
          </form>

          <div className="divider my-6">ou</div>

          <p className="text-center text-sm text-ink-light">
            Pas encore de compte ?{' '}
            <Link to="/" className="font-medium text-amber-600 hover:text-amber-400 underline underline-offset-2">
              Créer mon compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

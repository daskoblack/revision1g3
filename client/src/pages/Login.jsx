import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', form);
      login(res.data.token, res.data.email);
      navigate('/textes');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* Panneau gauche identique à Landing (cohérence visuelle) */}
      <div className="lg:w-5/12 xl:w-2/5 bg-navy-900 text-white flex flex-col justify-between px-8 py-10 sm:px-12 lg:px-14">
        <div>
          <div className="mb-10 lg:mb-16">
            <p className="font-serif text-2xl font-bold text-amber-300 tracking-wide">M. Marin</p>
            <p className="text-navy-200 text-sm mt-1">Bac de Français · Terminale Générale</p>
          </div>
          <blockquote>
            <p className="font-serif text-xl sm:text-2xl lg:text-3xl font-medium text-white leading-relaxed italic">
              "La lecture est un voyage que l'on fait sans quitter son fauteuil."
            </p>
            <footer className="mt-4 text-navy-300 text-sm">— Proverbe littéraire</footer>
          </blockquote>
        </div>
        <div className="hidden lg:block mt-10 pt-6 border-t border-navy-700 text-navy-400 text-xs">
          Accès réservé aux élèves de la classe
        </div>
      </div>

      {/* Formulaire de connexion */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 bg-parchment-100">
        <div className="w-full max-w-md fade-up">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-ink">Content de te revoir !</h1>
            <p className="text-ink-light mt-2 text-sm">Connecte-toi pour accéder à tes fiches.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="email">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="field"
                placeholder="prenom.nom@lycee.fr"
                value={form.email}
                onChange={set('email')}
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base mt-2"
            >
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

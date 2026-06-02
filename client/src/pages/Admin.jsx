import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Admin() {
  const [adminSecret, setAdminSecret] = useState(() => localStorage.getItem('mm_admin_secret') || '');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State pour le changement de mot de passe
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (adminSecret) {
      verifyAdminSecret();
    }
  }, []); // eslint-disable-line

  const verifyAdminSecret = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users', {
        headers: { 'x-admin-secret': adminSecret }
      });
      setUsers(res.data.users);
      setIsAuthorized(true);
      localStorage.setItem('mm_admin_secret', adminSecret);
    } catch (err) {
      setError(err.response?.data?.error ?? "Clé secrète invalide ou non configurée.");
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem('mm_admin_secret');
    setAdminSecret('');
    setIsAuthorized(false);
    setUsers([]);
  };

  const handleResetQuota = async (id, username) => {
    if (!window.confirm(`Voulez-vous réinitialiser les quotas quotidiens de @${username} ?`)) return;
    try {
      await axios.post(`/api/admin/users/${id}/reset-quota`, {}, {
        headers: { 'x-admin-secret': adminSecret }
      });
      alert("Quotas réinitialisés avec succès.");
      setUsers(users.map(u => u.id === id ? { ...u, messages_used: 0, texts_created_today: 0 } : u));
    } catch (err) {
      alert("Une erreur est survenue.");
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`⚠️ ATTENTION : Êtes-vous sûr de vouloir supprimer définitivement le compte de @${username} ?\nToutes ses fiches et discussions seront perdues.`)) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, {
        headers: { 'x-admin-secret': adminSecret }
      });
      alert("Compte élève supprimé avec succès.");
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert("Une erreur est survenue.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword.length < 8) return setPwError("Le mot de passe doit faire au moins 8 caractères.");

    setPwLoading(true);
    try {
      await axios.post(`/api/admin/users/${selectedUserId}/reset-password`, { newPassword }, {
        headers: { 'x-admin-secret': adminSecret }
      });
      setPwSuccess("Le mot de passe a bien été mis à jour !");
      setNewPassword('');
      setTimeout(() => {
        setSelectedUserId(null);
        setPwSuccess('');
      }, 1500);
    } catch (err) {
      setPwError(err.response?.data?.error ?? "Erreur lors du changement de mot de passe.");
    } finally {
      setPwLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="bg-white border border-parchment-300 rounded-2xl p-6 sm:p-8 shadow-sm max-w-md w-full space-y-6">
          <div className="text-center">
            <span className="text-4xl block mb-2">🛡️</span>
            <h1 className="font-serif text-2xl font-bold text-ink">Espace Administrateur</h1>
            <p className="text-xs text-ink-light mt-1">Saisissez le code secret pour gérer les comptes élèves.</p>
          </div>

          <form onSubmit={verifyAdminSecret} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1" htmlFor="admin-secret">
                Code secret (ADMIN_SECRET)
              </label>
              <input
                id="admin-secret"
                type="password"
                placeholder="Votre code secret"
                className="field w-full"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                required
              />
            </div>

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Vérification...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 animate-fade-in">
      
      {/* En-tête admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-parchment-200 pb-5">
        <div>
          <h1 className="font-serif text-3xl font-bold text-red-700 flex items-center gap-2">
            <span>🛡️</span> Console d'Administration
          </h1>
          <p className="text-sm text-ink-light">Gère les comptes élèves, réinitialise les quotas ou modifie les mots de passe.</p>
        </div>
        <button
          onClick={handleLogoutAdmin}
          className="border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Déconnexion Admin
        </button>
      </div>

      {/* Modal pour changer le mot de passe */}
      {selectedUserId && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-parchment-300 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold text-ink">Changer le mot de passe</h3>
              <button
                onClick={() => { setSelectedUserId(null); setPwError(''); setPwSuccess(''); setNewPassword(''); }}
                className="text-ink-light hover:text-ink transition-colors"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-ink-light">
              Entrez le nouveau mot de passe pour l'élève @{users.find(u => u.id === selectedUserId)?.username}.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Minimum 8 caractères"
                  className="field w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {pwError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2.5">
                  {pwError}
                </div>
              )}

              {pwSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg p-2.5">
                  {pwSuccess}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setSelectedUserId(null); setPwError(''); setPwSuccess(''); setNewPassword(''); }}
                  className="border border-parchment-350 text-ink hover:bg-parchment-100 text-xs px-3.5 py-2 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs px-3.5 py-2 rounded-lg font-semibold transition-colors"
                >
                  {pwLoading ? 'Mise à jour...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tableau des utilisateurs */}
      <div className="bg-white border border-parchment-300 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 bg-parchment-50 border-b border-parchment-300 flex justify-between items-center">
          <h2 className="font-serif text-lg font-bold text-ink">Élèves inscrits ({users.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink-light">
            <thead className="bg-parchment-50 text-[10px] text-ink uppercase tracking-wider border-b border-parchment-200">
              <tr>
                <th className="px-6 py-3 font-bold">Élève</th>
                <th className="px-6 py-3 font-bold">Classe</th>
                <th className="px-6 py-3 font-bold text-center">Messages d'aujourd'hui</th>
                <th className="px-6 py-3 font-bold text-center">Fiches créées</th>
                <th className="px-6 py-3 font-bold">Date d'inscription</th>
                <th className="px-6 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-parchment-50/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-ink flex items-center gap-1.5">
                    <span>👤</span> @{u.username}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-navy-100 text-navy-600 font-semibold px-2 py-0.5 rounded text-xs">
                      {u.classe || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-semibold tabular-nums ${u.messages_used >= u.daily_quota ? 'text-red-600' : 'text-ink'}`}>
                      {u.messages_used}
                    </span>
                    <span className="text-ink-pale"> / {u.daily_quota}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-ink tabular-nums">
                    {u.texts_created_today} <span className="text-ink-pale">/ 2</span>
                  </td>
                  <td className="px-6 py-4 text-xs tabular-nums">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedUserId(u.id)}
                        className="text-xs border border-parchment-350 text-ink hover:bg-parchment-100 px-2 py-1 rounded-lg transition-colors font-medium"
                        title="Réinitialiser le mot de passe"
                      >
                        🔑 Mot de Passe
                      </button>
                      <button
                        onClick={() => handleResetQuota(u.id, u.username)}
                        className="text-xs border border-amber-300 text-amber-800 hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors font-medium"
                        title="Remettre à zéro les quotas"
                      >
                        ⚡ Quotas
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors font-bold"
                        title="Supprimer définitivement le compte"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-ink-light">
                    Aucun élève inscrit pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

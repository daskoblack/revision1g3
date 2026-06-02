import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import TextList from './pages/TextList';
import TextDetail from './pages/TextDetail';
import CreateText from './pages/CreateText';
import MyTexts from './pages/MyTexts';
import ClassTexts from './pages/ClassTexts';
import SharedTextView from './pages/SharedTextView';
import UserTextDetail from './pages/UserTextDetail';
import Admin from './pages/Admin';

// Route accessible uniquement si connecté
function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/" replace />;
}

// Route accessible uniquement si non connecté (redirection auto si déjà connecté)
function PublicRoute({ children }) {
  const { token } = useAuth();
  return !token ? children : <Navigate to="/textes" replace />;
}

function AppRoutes() {
  const { token } = useAuth();
  return (
    <>
      {token && <Navbar />}
      <Routes>
        {/* Accueil = inscription (si non connecté) ou redirect textes */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/connexion" element={<PublicRoute><Login /></PublicRoute>} />

        {/* Zone protégée */}
        <Route path="/textes" element={<PrivateRoute><TextList /></PrivateRoute>} />
        <Route path="/textes/:id" element={<PrivateRoute><TextDetail /></PrivateRoute>} />
        <Route path="/creer-texte" element={<PrivateRoute><CreateText /></PrivateRoute>} />
        <Route path="/mes-textes" element={<PrivateRoute><MyTexts /></PrivateRoute>} />
        <Route path="/textes-classe" element={<PrivateRoute><ClassTexts /></PrivateRoute>} />
        <Route path="/textes-utilisateur/:slug" element={<PrivateRoute><UserTextDetail /></PrivateRoute>} />

        {/* Lien de partage public (lecture seule sans auth) */}
        <Route path="/textes/share/:token" element={<SharedTextView />} />

        {/* Administration */}
        <Route path="/admin" element={<Admin />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={token ? '/textes' : '/'} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Connexion from './auth/Connexion.jsx'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import { ROLE_HOME, ROUTE_ROLES } from './auth/roles.js'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import NetworkStatus from './components/NetworkStatus.jsx'
import Layout from './components/Layout.jsx'
import PageSkeleton from './components/PageSkeleton.jsx'

// Ici, contrairement a l'app client, la connexion EST necessaire :
// c'est l'outil du personnel (roles : CUISINE, GERANT, MANAGER, LIVREUR),
// pas l'app publique des clients. Chaque role est redirige vers son espace.
// Chaque ecran vit dans features/<role>/ (une equipe = ses dossiers,
// Connexion.jsx reste dans pages/ car commun aux 4 roles, avant qu'un
// role ne soit connu).

const PAGES = {
  '/dashboard': lazy(() => import('./features/dashboard/Dashboard.jsx')),
  '/commandes': lazy(() => import('./features/cuisine/Commandes.jsx')),
  '/preparation': lazy(() => import('./features/cuisine/Preparation.jsx')),
  '/livraisons': lazy(() => import('./features/livreur/Livraisons.jsx')),
  '/menu': lazy(() => import('./features/gerant/Menu.jsx')),
  '/personnel': lazy(() => import('./features/manager/Personnel.jsx')),
  '/statistiques': lazy(() => import('./features/manager/Statistiques.jsx')),
}

function RoleHome() {
  const { role } = useAuth()
  return <Navigate to={role ? ROLE_HOME[role] : '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NetworkStatus />
        <Routes>
          <Route path="/login" element={<Connexion />} />
          {Object.entries(PAGES).map(([path, Page]) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute roles={ROUTE_ROLES[path]}>
                  <Suspense fallback={<Layout><PageSkeleton page={path.slice(1)} /></Layout>}>
                    <Page />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          ))}
          <Route path="*" element={<RoleHome />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

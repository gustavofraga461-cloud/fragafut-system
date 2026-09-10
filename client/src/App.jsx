import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Layout from './Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Championships from './pages/Championships'
import ChampionshipDetail from './pages/ChampionshipDetail'
import PublicChampionship from './pages/PublicChampionship'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import Players from './pages/Players'
import Matches from './pages/Matches'
import MatchLive from './pages/MatchLive'
import Admin, { UsersAdmin } from './pages/Admin'

function Guard({ children, roles }) {
  const { user, ready } = useAuth()
  if (!ready) return <div className="container">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/campeonatos" element={<Championships />} />
            <Route path="/campeonatos/:id" element={<ChampionshipDetail />} />
            <Route path="/publico/:slug" element={<PublicChampionship />} />
            <Route path="/times" element={<Teams />} />
            <Route path="/times/:id" element={<TeamDetail />} />
            <Route path="/jogadores" element={<Players />} />
            <Route path="/partidas" element={<Matches />} />
            <Route path="/partidas/:id" element={<MatchLive />} />
            <Route path="/admin" element={<Guard roles={['admin', 'organizer']}><Admin /></Guard>} />
            <Route path="/admin/usuarios" element={<Guard roles={['admin']}><UsersAdmin /></Guard>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from './AuthContext'
import { RoleLabel } from './components'

export default function Layout() {
  const { user, logout, canManage, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()

  return (
    <div className="app-bg">
      <header className="topbar">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <Logo size={44} />
          <div className="brand-text">
            <strong>FRAGAFUT</strong>
            <span>Seu futsal. Em tempo real.</span>
          </div>
        </Link>
        <button className="menu-btn" onClick={() => setOpen((v) => !v)}>Menu</button>
        <nav className={`nav ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          <NavLink to="/" end>Início</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/campeonatos">Campeonatos</NavLink>
          <NavLink to="/times">Times</NavLink>
          <NavLink to="/jogadores">Jogadores</NavLink>
          <NavLink to="/partidas">Jogos</NavLink>
          {canManage && <NavLink to="/admin">Painel</NavLink>}
          {isAdmin && <NavLink to="/admin/usuarios">Usuários</NavLink>}
        </nav>
        {user ? (
          <div className="user-chip">
            <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{user.name}</div>
              <RoleLabel role={user.role} />
            </div>
            <button className="btn ghost" style={{ padding: '6px 10px' }} onClick={() => { logout(); nav('/login') }}>Sair</button>
          </div>
        ) : (
          <Link className="btn" to="/login">Entrar</Link>
        )}
      </header>
      <Outlet />
      <footer className="footer">FRAGAFUT · Seu futsal. Em tempo real. · Sistema exclusivo de futsal</footer>
    </div>
  )
}

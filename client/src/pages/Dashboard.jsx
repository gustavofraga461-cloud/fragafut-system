import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { MatchRow } from '../components'
import { useAuth } from '../AuthContext'
import { getSocket } from '../socket'

export default function Dashboard() {
  const { user, canManage } = useAuth()
  const [dash, setDash] = useState(null)
  const load = () => api('/api/dashboard').then(setDash).catch(() => {})
  useEffect(() => {
    load()
    const s = getSocket()
    s.on('live:update', load)
    return () => s.off('live:update', load)
  }, [])
  if (!dash) return <div className="container">Carregando...</div>

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>{user ? `Olá, ${user.name}` : 'Acompanhe o futsal em tempo real'}</p>
        </div>
        {canManage && <Link className="btn" to="/admin">Gerenciar</Link>}
      </div>
      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        <div className="card stat"><span className="n">{dash.stats.championships}</span><span className="l">Campeonatos</span></div>
        <div className="card stat"><span className="n">{dash.stats.teams}</span><span className="l">Times</span></div>
        <div className="card stat"><span className="n">{dash.stats.players}</span><span className="l">Jogadores</span></div>
        <div className="card stat"><span className="n">{dash.stats.matches}</span><span className="l">Partidas</span></div>
      </div>
      <div className="grid grid-2">
        <div>
          <h3 style={{ marginBottom: 10 }}>Ao vivo</h3>
          {dash.live.length === 0 && <div className="card">Nenhum jogo ao vivo agora.</div>}
          <div className="grid">{dash.live.map((m) => <MatchRow key={m.id} m={m} />)}</div>
        </div>
        <div>
          <h3 style={{ marginBottom: 10 }}>Campeonatos</h3>
          <div className="grid">
            {dash.championships.map((c) => (
              <Link key={c.id} to={`/publico/${c.slug}`} className="card">
                <strong>{c.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{c.season} · {c.teams_count} times · {c.status}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="page-head" style={{ marginTop: 28 }}><h1>Resultados</h1></div>
      <div className="grid grid-2">{dash.recent.map((m) => <MatchRow key={m.id} m={m} />)}</div>
    </div>
  )
}

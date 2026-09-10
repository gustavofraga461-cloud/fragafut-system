import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../Logo'
import { api } from '../api'
import { MatchRow } from '../components'

export default function Home() {
  const [dash, setDash] = useState(null)
  useEffect(() => { api('/api/dashboard').then(setDash).catch(() => {}) }, [])

  return (
    <div className="container">
      <section className="hero">
        <div>
          <div className="slogan">Seu futsal. Em tempo real.</div>
          <h1>FRAGAFUT</h1>
          <p>Gerencie campeonatos de futsal com placar ao vivo, classificação automática, artilharia e acesso público para a torcida.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn" to="/campeonatos">Ver campeonatos</Link>
            <Link className="btn ghost" to="/login">Acessar painel</Link>
          </div>
        </div>
        <div className="card" style={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
          <Logo size={180} />
        </div>
      </section>

      {dash && (
        <>
          <div className="grid grid-4" style={{ margin: '28px 0' }}>
            <div className="card stat"><span className="n">{dash.stats.championships}</span><span className="l">Campeonatos</span></div>
            <div className="card stat"><span className="n">{dash.stats.teams}</span><span className="l">Times</span></div>
            <div className="card stat"><span className="n">{dash.stats.players}</span><span className="l">Jogadores</span></div>
            <div className="card stat red"><span className="n">{dash.stats.live}</span><span className="l">Jogos ao vivo</span></div>
          </div>
          {dash.live?.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <div className="page-head"><h1>Ao vivo</h1></div>
              <div className="grid grid-2">{dash.live.map((m) => <MatchRow key={m.id} m={m} />)}</div>
            </section>
          )}
          <section>
            <div className="page-head"><h1>Próximos jogos</h1><Link to="/partidas">Ver todos</Link></div>
            <div className="grid grid-2">{dash.upcoming?.map((m) => <MatchRow key={m.id} m={m} />)}</div>
          </section>
        </>
      )}
    </div>
  )
}

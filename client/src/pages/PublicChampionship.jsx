import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { MatchRow } from '../components'
import { StandingsTable, ScorersTable, CardsTable } from './ChampionshipDetail'
import { getSocket } from '../socket'

export default function PublicChampionship() {
  const { slug } = useParams()
  const [c, setC] = useState(null)
  const [tab, setTab] = useState('tabela')
  const load = () => api(`/api/championships/${slug}`).then(setC)
  useEffect(() => {
    load()
    const s = getSocket()
    const onUp = () => load()
    s.on('live:update', onUp)
    s.on('champ:update', onUp)
    return () => { s.off('live:update', onUp); s.off('champ:update', onUp) }
  }, [slug])
  if (!c) return <div className="container">Carregando página pública...</div>
  const upcoming = c.matches.filter((m) => m.status === 'scheduled')
  const live = c.matches.filter((m) => m.status === 'live')
  const results = c.matches.filter((m) => m.status === 'finished')

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <div className="slogan">Página pública · sem login</div>
          <h1>{c.name}</h1>
          <p>{c.season} · {c.venue} · {c.description}</p>
        </div>
      </div>
      <div className="tabs">
        {['tabela', 'jogos', 'resultados', 'artilharia'].map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'tabela' && <StandingsTable rows={c.standings} />}
      {tab === 'jogos' && (
        <div className="grid grid-2">
          {live.map((m) => <MatchRow key={m.id} m={m} />)}
          {upcoming.map((m) => <MatchRow key={m.id} m={m} />)}
        </div>
      )}
      {tab === 'resultados' && <div className="grid grid-2">{results.map((m) => <MatchRow key={m.id} m={m} />)}</div>}
      {tab === 'artilharia' && (
        <div className="grid grid-2">
          <ScorersTable rows={c.scorers} />
          <CardsTable rows={c.cards} />
        </div>
      )}
      <p style={{ marginTop: 18, color: 'var(--muted)' }}><Link to="/login">Entrar no sistema</Link> para gerenciar.</p>
    </div>
  )
}

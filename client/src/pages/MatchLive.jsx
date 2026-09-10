import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { Crest, StatusPill, formatWhen } from '../components'
import { getSocket } from '../socket'

const EV_LABEL = {
  goal: 'Gol',
  yellow: 'Cartão amarelo',
  red: 'Cartão vermelho',
  sub: 'Substituição'
}

export default function MatchLive() {
  const { id } = useParams()
  const { canManage } = useAuth()
  const [m, setM] = useState(null)
  const [homePlayers, setHomePlayers] = useState([])
  const [awayPlayers, setAwayPlayers] = useState([])
  const [minute, setMinute] = useState(1)
  const [err, setErr] = useState('')

  const load = async () => {
    const match = await api(`/api/matches/${id}`)
    setM(match)
    const [hp, ap] = await Promise.all([
      api(`/api/players?team_id=${match.home_team_id}`),
      api(`/api/players?team_id=${match.away_team_id}`)
    ])
    setHomePlayers(hp)
    setAwayPlayers(ap)
  }

  useEffect(() => {
    load()
    const s = getSocket()
    s.emit('join:match', Number(id))
    const onUp = (data) => { if (data && String(data.id) === String(id)) setM(data) }
    s.on('match:update', onUp)
    s.on('live:update', load)
    return () => {
      s.emit('leave:match', Number(id))
      s.off('match:update', onUp)
      s.off('live:update', load)
    }
  }, [id])

  const postEvent = async (payload) => {
    setErr('')
    try {
      const d = await api(`/api/matches/${id}/events`, { method: 'POST', body: JSON.stringify({ ...payload, minute: Number(minute) }) })
      setM(d.match)
    } catch (ex) { setErr(ex.message) }
  }

  const start = async () => { await api(`/api/matches/${id}/start`, { method: 'POST' }); load() }
  const finish = async () => { await api(`/api/matches/${id}/finish`, { method: 'POST' }); load() }

  if (!m) return <div className="container">Carregando partida...</div>

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <div className="slogan">Rodada {m.round} · {m.venue} · {formatWhen(m.scheduled_at)}</div>
          <h1>Partida</h1>
        </div>
        <StatusPill status={m.status} />
      </div>

      <div className="scoreboard" style={{ marginBottom: 22 }}>
        <div className="side">
          <Crest src={m.home?.crest} alt={m.home?.name} className="crest lg" />
          <h2>{m.home?.name}</h2>
        </div>
        <div>
          <div className="score">{m.home_score} – {m.away_score}</div>
          {m.status === 'live' && <div style={{ textAlign: 'center' }}><span className="live-dot">● AO VIVO</span></div>}
        </div>
        <div className="side">
          <Crest src={m.away?.crest} alt={m.away?.name} className="crest lg" />
          <h2>{m.away?.name}</h2>
        </div>
      </div>

      {canManage && (
        <div className="card" style={{ marginBottom: 22 }}>
          <h3>Modo partida ao vivo</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
            {m.status !== 'live' && m.status !== 'finished' && <button className="btn ok" onClick={start}>Iniciar jogo</button>}
            {m.status === 'live' && <button className="btn warn" onClick={finish}>Encerrar jogo</button>}
            <label style={{ minWidth: 120 }}>Minuto
              <input type="number" min="0" max="50" value={minute} onChange={(e) => setMinute(e.target.value)} />
            </label>
          </div>
          <TeamActions team={m.home} players={homePlayers} onEvent={postEvent} />
          <TeamActions team={m.away} players={awayPlayers} onEvent={postEvent} />
          {err && <div className="err">{err}</div>}
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h3>Lance a lance</h3>
          <div className="timeline">
            {(m.events || []).length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhum evento ainda.</p>}
            {(m.events || []).map((e) => (
              <div key={e.id} className="ev">
                <span className="min">{e.minute}'</span>
                <strong>{EV_LABEL[e.type]}</strong>
                <span>{e.player_nickname || e.player_name || ''} {e.type === 'sub' && e.player_out_name ? `sobe / ${e.player_out_nickname || e.player_out_name} sai` : ''}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{e.team_name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Elencos</h3>
          <p style={{ fontWeight: 700, margin: '8px 0' }}>{m.home?.name}</p>
          {homePlayers.map((p) => <div key={p.id} style={{ fontSize: 13 }}>{p.number} · {p.name} · {p.position}</div>)}
          <p style={{ fontWeight: 700, margin: '12px 0 8px' }}>{m.away?.name}</p>
          {awayPlayers.map((p) => <div key={p.id} style={{ fontSize: 13 }}>{p.number} · {p.name} · {p.position}</div>)}
          <p style={{ marginTop: 14 }}><Link to={`/campeonatos/${m.championship_id}`}>Ver campeonato</Link></p>
        </div>
      </div>
    </div>
  )
}

function TeamActions({ team, players, onEvent }) {
  const [player, setPlayer] = useState('')
  const [outP, setOutP] = useState('')
  useEffect(() => {
    if (players[0]) setPlayer(String(players[0].id))
    if (players[1]) setOutP(String(players[1].id))
  }, [players])
  if (!team) return null
  return (
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 12 }}>
      <strong>{team.name}</strong>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <select value={player} onChange={(e) => setPlayer(e.target.value)}>
          {players.map((p) => <option key={p.id} value={p.id}>#{p.number} {p.nickname || p.name}</option>)}
        </select>
        <button className="btn" type="button" onClick={() => onEvent({ type: 'goal', team_id: team.id, player_id: Number(player) })}>Gol</button>
        <button className="btn ghost" type="button" onClick={() => onEvent({ type: 'yellow', team_id: team.id, player_id: Number(player) })}>Amarelo</button>
        <button className="btn ghost" type="button" onClick={() => onEvent({ type: 'red', team_id: team.id, player_id: Number(player) })}>Vermelho</button>
        <select value={outP} onChange={(e) => setOutP(e.target.value)}>
          {players.map((p) => <option key={p.id} value={p.id}>Sai #{p.number}</option>)}
        </select>
        <button className="btn ghost" type="button" onClick={() => onEvent({ type: 'sub', team_id: team.id, player_id: Number(player), player_out_id: Number(outP) })}>Substituir</button>
      </div>
    </div>
  )
}

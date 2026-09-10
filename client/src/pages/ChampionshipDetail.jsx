import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { Crest, Field, ImageInput } from '../components'
import { getSocket } from '../socket'

export default function ChampionshipDetail() {
  const { id } = useParams()
  const { canManage } = useAuth()
  const [c, setC] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [editErr, setEditErr] = useState('')
  const [editOk, setEditOk] = useState('')
  const load = () => api(`/api/championships/${id}`).then((d) => {
    setC(d)
    setEditForm({ name: d.name, season: d.season || '', venue: d.venue || '', description: d.description || '', logo: d.logo || '' })
  })
  useEffect(() => {
    load()
    const s = getSocket()
    const onUp = () => load()
    s.on('live:update', onUp)
    s.on('champ:update', onUp)
    return () => { s.off('live:update', onUp); s.off('champ:update', onUp) }
  }, [id])
  if (!c) return <div className="container">Carregando...</div>

  const saveChamp = async (e) => {
    e.preventDefault(); setEditErr(''); setEditOk('')
    try {
      await api(`/api/championships/${id}`, { method: 'PATCH', body: JSON.stringify(editForm) })
      setEditOk('Campeonato atualizado.')
      load()
    } catch (ex) { setEditErr(ex.message) }
  }

  return (
    <div className="container">
      <div className="page-head">
        <div className="team-cell">
          {c.logo && <Crest src={c.logo} alt={c.name} className="crest lg" />}
          <div>
            <h1>{c.name}</h1>
            <p>{c.season} · {c.venue} · {c.description}</p>
          </div>
        </div>
        <Link className="btn ghost" to={`/publico/${c.slug}`}>Visão pública</Link>
      </div>

      {canManage && editForm && (
        <form className="card form" onSubmit={saveChamp} style={{ marginBottom: 22 }}>
          <h3 style={{ marginTop: 0 }}>Editar campeonato</h3>
          <ImageInput label="Logo do campeonato" value={editForm.logo} onChange={(v) => setEditForm({ ...editForm, logo: v })} shape="square" />
          <div className="grid grid-2">
            <Field label="Nome"><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></Field>
            <Field label="Temporada"><input value={editForm.season} onChange={(e) => setEditForm({ ...editForm, season: e.target.value })} /></Field>
            <Field label="Local"><input value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} /></Field>
          </div>
          <Field label="Descrição"><textarea rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></Field>
          {editErr && <div className="err">{editErr}</div>}
          {editOk && <div className="okmsg">{editOk}</div>}
          <button className="btn" type="submit">Salvar campeonato</button>
        </form>
      )}

      <StandingsTable rows={c.standings} />
      <div className="grid grid-2" style={{ marginTop: 22 }}>
        <ScorersTable rows={c.scorers} />
        <CardsTable rows={c.cards} />
      </div>
      <h3 style={{ margin: '22px 0 10px' }}>Times</h3>
      <div className="grid grid-3">
        {c.teams.map((t) => (
          <Link key={t.id} to={`/times/${t.id}`} className="card team-cell">
            <Crest src={t.crest} alt={t.name} className="crest lg" />
            <div><strong>{t.name}</strong><div style={{ color: 'var(--muted)', fontSize: 12 }}>Técnico: {t.coach || '—'}</div></div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function StandingsTable({ rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th><th>Time</th><th>PTS</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th>
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((r) => (
            <tr key={r.team_id}>
              <td className={`pos ${r.position === 1 ? 'gold' : r.position === 2 ? 'silver' : r.position === 3 ? 'bronze' : ''}`}>{r.position}</td>
              <td><div className="team-cell"><Crest src={r.crest} alt={r.team_name} />{r.team_name}</div></td>
              <td><strong>{r.pts}</strong></td>
              <td>{r.j}</td><td>{r.v}</td><td>{r.e}</td><td>{r.d}</td><td>{r.gp}</td><td>{r.gc}</td><td>{r.sg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ScorersTable({ rows }) {
  return (
    <div className="card">
      <h3>Artilharia</h3>
      <div className="table-wrap" style={{ border: 0 }}>
        <table style={{ minWidth: 0 }}>
          <thead><tr><th>#</th><th>Jogador</th><th>Gols</th></tr></thead>
          <tbody>
            {(rows || []).map((r, i) => (
              <tr key={r.player_id}>
                <td>{i + 1}</td>
                <td>{r.nickname || r.name} <span style={{ color: 'var(--muted)' }}>({r.team_name})</span></td>
                <td><strong>{r.goals}</strong></td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && <tr><td colSpan={3}>Sem gols ainda</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CardsTable({ rows }) {
  return (
    <div className="card">
      <h3>Cartões</h3>
      <div className="table-wrap" style={{ border: 0 }}>
        <table style={{ minWidth: 0 }}>
          <thead><tr><th>Jogador</th><th>Amarelo</th><th>Vermelho</th></tr></thead>
          <tbody>
            {(rows || []).map((r) => (
              <tr key={r.player_id}>
                <td>{r.nickname || r.name} <span style={{ color: 'var(--muted)' }}>({r.team_name})</span></td>
                <td>{r.yellow}</td><td>{r.red}</td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && <tr><td colSpan={3}>Sem cartões</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

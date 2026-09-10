import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { Field, MatchRow } from '../components'

export default function Matches() {
  const { canManage } = useAuth()
  const [matches, setMatches] = useState([])
  const [champs, setChamps] = useState([])
  const [teams, setTeams] = useState([])
  const [tab, setTab] = useState('todos')
  const [form, setForm] = useState({ championship_id: '', home_team_id: '', away_team_id: '', round: 1, scheduled_at: '', venue: '' })
  const [err, setErr] = useState('')

  const load = () => api('/api/matches').then(setMatches)
  useEffect(() => {
    load()
    api('/api/championships').then((c) => {
      setChamps(c)
      if (c[0]) {
        setForm((f) => ({ ...f, championship_id: f.championship_id || c[0].id }))
        api(`/api/teams?championship_id=${c[0].id}`).then(setTeams)
      }
    })
  }, [])

  const changeChamp = (id) => {
    setForm({ ...form, championship_id: id, home_team_id: '', away_team_id: '' })
    api(`/api/teams?championship_id=${id}`).then(setTeams)
  }

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try {
      await api('/api/matches', { method: 'POST', body: JSON.stringify(form) })
      setForm({ ...form, scheduled_at: '' })
      load()
    } catch (ex) { setErr(ex.message) }
  }

  const filtered = matches.filter((m) => {
    if (tab === 'proximos') return m.status === 'scheduled'
    if (tab === 'ao-vivo') return m.status === 'live'
    if (tab === 'resultados') return m.status === 'finished'
    return true
  })

  return (
    <div className="container">
      <div className="page-head"><div><h1>Jogos</h1><p>Próximos, ao vivo e resultados</p></div></div>
      {canManage && (
        <form className="card form" onSubmit={submit} style={{ marginBottom: 22 }}>
          <div className="grid grid-2">
            <Field label="Campeonato">
              <select value={form.championship_id} onChange={(e) => changeChamp(e.target.value)} required>
                {champs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Rodada"><input type="number" value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} /></Field>
            <Field label="Mandante">
              <select value={form.home_team_id} onChange={(e) => setForm({ ...form, home_team_id: e.target.value })} required>
                <option value="">Selecione</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Visitante">
              <select value={form.away_team_id} onChange={(e) => setForm({ ...form, away_team_id: e.target.value })} required>
                <option value="">Selecione</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Data e horário"><input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} required /></Field>
            <Field label="Local"><input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></Field>
          </div>
          {err && <div className="err">{err}</div>}
          <button className="btn" type="submit">Cadastrar partida</button>
        </form>
      )}
      <div className="tabs">
        {[['todos', 'Todos'], ['proximos', 'Próximos'], ['ao-vivo', 'Ao vivo'], ['resultados', 'Resultados']].map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      <div className="grid grid-2">{filtered.map((m) => <MatchRow key={m.id} m={m} />)}</div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { Crest, Field } from '../components'

const defaultCrest = (abbr) => {
  const a = (abbr || 'TIM').slice(0, 3).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="#C41E3A" stroke="#fff" stroke-width="3"/><text x="40" y="48" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#fff">${a}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export default function Teams() {
  const { canManage } = useAuth()
  const [teams, setTeams] = useState([])
  const [champs, setChamps] = useState([])
  const [form, setForm] = useState({ championship_id: '', name: '', short_name: '', coach: '', color: '#C41E3A' })
  const [err, setErr] = useState('')
  const load = () => {
    api('/api/teams').then(setTeams)
    api('/api/championships').then((c) => {
      setChamps(c)
      if (!form.championship_id && c[0]) setForm((f) => ({ ...f, championship_id: c[0].id }))
    })
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try {
      await api('/api/teams', {
        method: 'POST',
        body: JSON.stringify({ ...form, crest: defaultCrest(form.short_name || form.name) })
      })
      setForm({ ...form, name: '', short_name: '', coach: '' })
      load()
    } catch (ex) { setErr(ex.message) }
  }

  return (
    <div className="container">
      <div className="page-head"><div><h1>Times</h1><p>Nome, escudo, técnico e elenco</p></div></div>
      {canManage && (
        <form className="card form" onSubmit={submit} style={{ marginBottom: 22 }}>
          <div className="grid grid-2">
            <Field label="Campeonato">
              <select value={form.championship_id} onChange={(e) => setForm({ ...form, championship_id: e.target.value })} required>
                {champs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Nome"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Sigla"><input value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} maxLength={4} /></Field>
            <Field label="Técnico"><input value={form.coach} onChange={(e) => setForm({ ...form, coach: e.target.value })} /></Field>
          </div>
          {err && <div className="err">{err}</div>}
          <button className="btn" type="submit">Cadastrar time</button>
        </form>
      )}
      <div className="grid grid-3">
        {teams.map((t) => (
          <Link key={t.id} to={`/times/${t.id}`} className="card">
            <div className="team-cell">
              <Crest src={t.crest} alt={t.name} className="crest lg" />
              <div>
                <strong>{t.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{t.championship_name}</div>
                <div style={{ fontSize: 12 }}>Técnico: {t.coach || '—'} · {t.players_count} jogadores</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

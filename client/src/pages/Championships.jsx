import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { Crest, Field, ImageInput, StatusPill } from '../components'

export default function Championships() {
  const { canManage } = useAuth()
  const [list, setList] = useState([])
  const [form, setForm] = useState({ name: '', season: '2026', venue: '', description: '', start_date: '', end_date: '', status: 'ongoing', logo: '' })
  const [err, setErr] = useState('')
  const load = () => api('/api/championships').then(setList)
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try {
      await api('/api/championships', { method: 'POST', body: JSON.stringify(form) })
      setForm({ ...form, name: '', description: '', logo: '' })
      load()
    } catch (ex) { setErr(ex.message) }
  }

  return (
    <div className="container">
      <div className="page-head"><div><h1>Campeonatos</h1><p>Cadastre e acompanhe ligas de futsal</p></div></div>
      {canManage && (
        <form className="card form" onSubmit={submit} style={{ marginBottom: 22 }}>
          <ImageInput label="Logo do campeonato" value={form.logo} onChange={(v) => setForm({ ...form, logo: v })} shape="square" />
          <div className="grid grid-2">
            <Field label="Nome"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Temporada"><input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} /></Field>
            <Field label="Local"><input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Rascunho</option>
                <option value="ongoing">Em andamento</option>
                <option value="finished">Encerrado</option>
              </select>
            </Field>
            <Field label="Início"><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
            <Field label="Fim"><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
          </div>
          <Field label="Descrição"><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          {err && <div className="err">{err}</div>}
          <button className="btn" type="submit">Cadastrar campeonato</button>
        </form>
      )}
      <div className="grid grid-2">
        {list.map((c) => (
          <div key={c.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="team-cell">
                {c.logo && <Crest src={c.logo} alt={c.name} className="crest lg" />}
                <h3 style={{ margin: 0 }}>{c.name}</h3>
              </div>
              <StatusPill status={c.status} />
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>{c.season} · {c.venue || '—'} · {c.teams_count} times · {c.matches_count} jogos</p>
            <p style={{ margin: '8px 0 14px', fontSize: 14 }}>{c.description}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link className="btn" to={`/publico/${c.slug}`}>Página pública</Link>
              <Link className="btn ghost" to={`/campeonatos/${c.id}`}>Detalhes</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

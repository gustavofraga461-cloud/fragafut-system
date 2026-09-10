import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { Crest, Field } from '../components'

export default function TeamDetail() {
  const { id } = useParams()
  const { canManage } = useAuth()
  const [team, setTeam] = useState(null)
  const [form, setForm] = useState({ name: '', nickname: '', number: '', position: 'Ala' })
  const [err, setErr] = useState('')
  const load = () => api(`/api/teams/${id}`).then(setTeam)
  useEffect(() => { load() }, [id])

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try {
      await api('/api/players', { method: 'POST', body: JSON.stringify({ ...form, team_id: Number(id) }) })
      setForm({ name: '', nickname: '', number: '', position: 'Ala' })
      load()
    } catch (ex) { setErr(ex.message) }
  }

  if (!team) return <div className="container">Carregando...</div>
  return (
    <div className="container">
      <div className="page-head">
        <div className="team-cell">
          <Crest src={team.crest} alt={team.name} className="crest lg" />
          <div>
            <h1>{team.name}</h1>
            <p>Técnico: {team.coach || '—'} · {team.championship_name}</p>
          </div>
        </div>
        <Link className="btn ghost" to={`/publico/${team.championship_slug}`}>Campeonato</Link>
      </div>
      {canManage && (
        <form className="card form" onSubmit={submit} style={{ marginBottom: 22 }}>
          <div className="grid grid-2">
            <Field label="Nome"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Apelido"><input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} /></Field>
            <Field label="Número"><input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required /></Field>
            <Field label="Posição">
              <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                <option>Goleiro</option><option>Fixo</option><option>Ala</option><option>Pivô</option>
              </select>
            </Field>
          </div>
          {err && <div className="err">{err}</div>}
          <button className="btn" type="submit">Adicionar jogador</button>
        </form>
      )}
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Nome</th><th>Apelido</th><th>Posição</th></tr></thead>
          <tbody>
            {team.players.map((p) => (
              <tr key={p.id}><td>{p.number}</td><td>{p.name}</td><td>{p.nickname || '—'}</td><td>{p.position}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

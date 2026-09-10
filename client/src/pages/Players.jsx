import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { Crest, Field } from '../components'

export default function Players() {
  const { canManage } = useAuth()
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [form, setForm] = useState({ team_id: '', name: '', nickname: '', number: '', position: 'Ala' })
  const [err, setErr] = useState('')
  const load = () => {
    api('/api/players').then(setPlayers)
    api('/api/teams').then((t) => {
      setTeams(t)
      if (!form.team_id && t[0]) setForm((f) => ({ ...f, team_id: t[0].id }))
    })
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try {
      await api('/api/players', { method: 'POST', body: JSON.stringify(form) })
      setForm({ ...form, name: '', nickname: '', number: '' })
      load()
    } catch (ex) { setErr(ex.message) }
  }

  return (
    <div className="container">
      <div className="page-head"><div><h1>Jogadores</h1><p>Nome, apelido, número e posição</p></div></div>
      {canManage && (
        <form className="card form" onSubmit={submit} style={{ marginBottom: 22 }}>
          <div className="grid grid-2">
            <Field label="Time">
              <select value={form.team_id} onChange={(e) => setForm({ ...form, team_id: e.target.value })} required>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
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
          <button className="btn" type="submit">Cadastrar jogador</button>
        </form>
      )}
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Jogador</th><th>Time</th><th>Posição</th></tr></thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id}>
                <td>{p.number}</td>
                <td>{p.name} {p.nickname ? `(${p.nickname})` : ''}</td>
                <td>
                  <Link to={`/times/${p.team_id}`} className="team-cell">
                    <Crest src={p.crest} alt={p.team_name} />{p.team_name}
                  </Link>
                </td>
                <td>{p.position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

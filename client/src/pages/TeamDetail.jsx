import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { Crest, Field, ImageInput } from '../components'

export default function TeamDetail() {
  const { id } = useParams()
  const { canManage } = useAuth()
  const [team, setTeam] = useState(null)
  const [form, setForm] = useState({ name: '', nickname: '', number: '', position: 'Ala' })
  const [editForm, setEditForm] = useState(null)
  const [err, setErr] = useState('')
  const [editErr, setEditErr] = useState('')
  const [editOk, setEditOk] = useState('')
  const load = () => api(`/api/teams/${id}`).then((t) => {
    setTeam(t)
    setEditForm({ name: t.name, short_name: t.short_name || '', coach: t.coach || '', color: t.color || '#C41E3A', crest: t.crest || '' })
  })
  useEffect(() => { load() }, [id])

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try {
      await api('/api/players', { method: 'POST', body: JSON.stringify({ ...form, team_id: Number(id) }) })
      setForm({ name: '', nickname: '', number: '', position: 'Ala' })
      load()
    } catch (ex) { setErr(ex.message) }
  }

  const saveTeam = async (e) => {
    e.preventDefault(); setEditErr(''); setEditOk('')
    try {
      await api(`/api/teams/${id}`, { method: 'PATCH', body: JSON.stringify(editForm) })
      setEditOk('Time atualizado.')
      load()
    } catch (ex) { setEditErr(ex.message) }
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

      {canManage && editForm && (
        <form className="card form" onSubmit={saveTeam} style={{ marginBottom: 22 }}>
          <h3 style={{ marginTop: 0 }}>Editar time</h3>
          <ImageInput label="Escudo do time" value={editForm.crest} onChange={(v) => setEditForm({ ...editForm, crest: v })} />
          <div className="grid grid-2">
            <Field label="Nome"><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></Field>
            <Field label="Sigla"><input value={editForm.short_name} onChange={(e) => setEditForm({ ...editForm, short_name: e.target.value })} maxLength={4} /></Field>
            <Field label="Técnico"><input value={editForm.coach} onChange={(e) => setEditForm({ ...editForm, coach: e.target.value })} /></Field>
            <Field label="Cor"><input type="color" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} /></Field>
          </div>
          {editErr && <div className="err">{editErr}</div>}
          {editOk && <div className="okmsg">{editOk}</div>}
          <button className="btn" type="submit">Salvar time</button>
        </form>
      )}

      {canManage && (
        <form className="card form" onSubmit={submit} style={{ marginBottom: 22 }}>
          <h3 style={{ marginTop: 0 }}>Adicionar jogador</h3>
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

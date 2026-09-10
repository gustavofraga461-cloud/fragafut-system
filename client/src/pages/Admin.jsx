import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { RoleLabel, Field } from '../components'

export default function Admin() {
  const { isAdmin, canManage } = useAuth()
  const [dash, setDash] = useState(null)
  useEffect(() => { api('/api/dashboard').then(setDash) }, [])
  if (!canManage) return <div className="container"><h1>Acesso negado</h1><p>Faça login como Administrador ou Organizador.</p></div>
  return (
    <div className="container">
      <div className="page-head"><div><h1>Painel administrativo</h1><p>Gerencie usuários, campeonatos, times, jogadores e partidas</p></div></div>
      {dash && (
        <div className="grid grid-4" style={{ marginBottom: 22 }}>
          <div className="card stat"><span className="n">{dash.stats.championships}</span><span className="l">Campeonatos</span></div>
          <div className="card stat"><span className="n">{dash.stats.teams}</span><span className="l">Times</span></div>
          <div className="card stat"><span className="n">{dash.stats.players}</span><span className="l">Jogadores</span></div>
          <div className="card stat"><span className="n">{dash.stats.users}</span><span className="l">Usuários</span></div>
        </div>
      )}
      <div className="grid grid-3">
        <Link className="card" to="/campeonatos"><h3>Campeonatos</h3><p>Criar e editar ligas</p></Link>
        <Link className="card" to="/times"><h3>Times</h3><p>Escudos, técnicos e elencos</p></Link>
        <Link className="card" to="/jogadores"><h3>Jogadores</h3><p>Números e posições</p></Link>
        <Link className="card" to="/partidas"><h3>Partidas</h3><p>Agenda e modo ao vivo</p></Link>
        {isAdmin && <Link className="card" to="/admin/usuarios"><h3>Usuários</h3><p>Contas de administrador e organizador</p></Link>}
        <Link className="card" to="/dashboard"><h3>Dashboard</h3><p>Visão geral em tempo real</p></Link>
      </div>
    </div>
  )
}

export function UsersAdmin() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [err, setErr] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', role: 'organizer' })
  const load = () => api('/api/users').then(setUsers).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [])
  if (!isAdmin) return <div className="container"><h1>Acesso restrito a Administrador</h1></div>

  const changeRole = async (id, role) => {
    await api(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) })
    load()
  }

  const createUser = async (e) => {
    e.preventDefault()
    setErr(''); setOkMsg('')
    try {
      await api('/api/users', { method: 'POST', body: JSON.stringify(form) })
      setForm({ name: '', email: '', username: '', password: '', role: 'organizer' })
      setOkMsg('Conta criada com sucesso.')
      load()
    } catch (ex) { setErr(ex.message) }
  }

  return (
    <div className="container">
      <div className="page-head"><div><h1>Usuários</h1><p>Somente Administrador e Organizador possuem login. O restante do público acessa tudo sem conta.</p></div></div>

      <form className="card form" onSubmit={createUser} style={{ marginBottom: 22 }}>
        <h3 style={{ marginTop: 0 }}>Criar nova conta</h3>
        <div className="grid grid-2">
          <Field label="Nome"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="E-mail"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Usuário"><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></Field>
          <Field label="Senha"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
          <Field label="Papel">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="organizer">Organizador</option>
              <option value="admin">Administrador</option>
            </select>
          </Field>
        </div>
        {err && <div className="err">{err}</div>}
        {okMsg && <div className="okmsg">{okMsg}</div>}
        <button className="btn" type="submit">Criar conta</button>
      </form>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>Usuário</th><th>E-mail</th><th>Papel</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                    <option value="admin">Administrador</option>
                    <option value="organizer">Organizador</option>
                  </select>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}><RoleLabel role={u.role} /></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../Logo'
import { useAuth } from '../AuthContext'
import { api } from '../api'
import { Field } from '../components'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState('login')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [form, setForm] = useState({ login: '', password: '', token: '' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setOk('')
    try {
      if (mode === 'login') {
        await login(form.login, form.password)
        nav('/admin')
      } else if (mode === 'forgot') {
        const d = await api('/api/auth/forgot', { method: 'POST', body: JSON.stringify({ login: form.login }) })
        setOk(d.message + (d.demo_code ? ` Código: ${d.demo_code}` : ''))
        setMode('reset')
      } else {
        await api('/api/auth/reset', { method: 'POST', body: JSON.stringify({ login: form.login, token: form.token, password: form.password }) })
        setOk('Senha redefinida. Faça login.')
        setMode('login')
      }
    } catch (ex) { setErr(ex.message) }
  }

  return (
    <div className="auth-wrap app-bg">
      <div className="card auth-card">
        <div className="logo-center"><Logo size={96} /></div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 40, textAlign: 'center' }}>FRAGAFUT</h1>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 18 }}>Seu futsal. Em tempo real.</p>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, marginBottom: 18 }}>
          Acesso exclusivo para Administrador e Organizador. Campeonatos, times, jogos e artilharia
          ficam abertos ao público em <Link to="/">Início</Link> sem necessidade de login.
        </p>
        <div className="tabs">
          <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Entrar</button>
          <button className={mode === 'forgot' || mode === 'reset' ? 'on' : ''} onClick={() => setMode('forgot')}>Recuperar senha</button>
        </div>
        <form className="form" onSubmit={submit}>
          {(mode === 'login' || mode === 'forgot' || mode === 'reset') && (
            <Field label="Usuário ou e-mail"><input value={form.login} onChange={set('login')} required /></Field>
          )}
          {mode === 'reset' && (
            <Field label="Código"><input value={form.token} onChange={set('token')} required /></Field>
          )}
          {mode !== 'forgot' && (
            <Field label="Senha"><input type="password" value={form.password} onChange={set('password')} required /></Field>
          )}
          {err && <div className="err">{err}</div>}
          {ok && <div className="okmsg">{ok}</div>}
          <button className="btn full" type="submit">
            {mode === 'login' ? 'Entrar' : mode === 'forgot' ? 'Enviar código' : 'Redefinir senha'}
          </button>
        </form>
        <p style={{ marginTop: 8, textAlign: 'center' }}><Link to="/">Voltar ao início</Link></p>
      </div>
    </div>
  )
}

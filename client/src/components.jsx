import { Link } from 'react-router-dom'

export function Crest({ src, alt, className = 'crest' }) {
  if (src) return <img className={className} src={src} alt={alt || ''} />
  return (
    <span className={className} style={{ display: 'grid', placeItems: 'center', background: '#C41E3A', fontSize: 10, fontWeight: 800 }}>
      {(alt || 'T').slice(0, 2).toUpperCase()}
    </span>
  )
}

export function StatusPill({ status }) {
  const map = {
    live: { label: 'AO VIVO', cls: 'live-dot' },
    scheduled: { label: 'PRÓXIMO', cls: '' },
    finished: { label: 'ENCERRADO', cls: '' },
    ongoing: { label: 'EM ANDAMENTO', cls: '' },
    draft: { label: 'RASCUNHO', cls: '' }
  }
  const s = map[status] || { label: status, cls: '' }
  if (status === 'live') return <span className="live-dot">● {s.label}</span>
  return <span className="role-badge" style={{ background: status === 'finished' ? '#333' : '#3a1a1a' }}>{s.label}</span>
}

export function MatchRow({ m }) {
  return (
    <Link to={`/partidas/${m.id}`} className="card" style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: 'var(--muted)' }}>
        <span>Rodada {m.round} · {m.venue || 'Local a definir'}</span>
        <StatusPill status={m.status} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
        <div className="team-cell"><Crest src={m.home?.crest} alt={m.home?.name} /> {m.home?.name}</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 28 }}>
          {m.status === 'scheduled' ? '×' : `${m.home_score} – ${m.away_score}`}
        </div>
        <div className="team-cell" style={{ justifyContent: 'flex-end' }}>{m.away?.name} <Crest src={m.away?.crest} alt={m.away?.name} /></div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
        {formatWhen(m.scheduled_at)}
      </div>
    </Link>
  )
}

export function formatWhen(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.replace('T', ' ').slice(0, 16)
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function RoleLabel({ role }) {
  const map = { admin: 'Administrador', organizer: 'Organizador' }
  return map[role] || role
}

export function Field({ label, children }) {
  return <label>{label}{children}</label>
}

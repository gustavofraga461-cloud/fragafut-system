import { Link } from 'react-router-dom'
import { useRef, useState } from 'react'

// Lê um arquivo de imagem escolhido pelo usuário, redimensiona no navegador
// (mantendo proporção) e devolve um data URL PNG pronto para salvar no banco
// como texto (mesmo esquema já usado pelos escudos gerados automaticamente).
function resizeImageFile(file, maxDim = 320) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Arquivo não é uma imagem válida'))
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim }
        else if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export function ImageInput({ label, value, onChange, shape = 'circle' }) {
  const inputRef = useRef(null)
  const [err, setErr] = useState('')

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setErr('Escolha um arquivo de imagem'); return }
    setErr('')
    try {
      const dataUrl = await resizeImageFile(file)
      onChange(dataUrl)
    } catch (ex) { setErr(ex.message) }
  }

  return (
    <label>
      {label}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: shape === 'circle' ? '50%' : 10,
            background: '#000', border: '1px solid var(--line)', overflow: 'hidden',
            display: 'grid', placeItems: 'center', flexShrink: 0
          }}
        >
          {value ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 10, color: 'var(--muted)' }}>sem imagem</span>}
        </div>
        <div>
          <button type="button" className="btn ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => inputRef.current?.click()}>
            {value ? 'Trocar imagem' : 'Escolher imagem'}
          </button>
          {value && (
            <button type="button" className="btn ghost" style={{ padding: '6px 10px', fontSize: 12, marginLeft: 6 }} onClick={() => onChange('')}>
              Remover
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} />
      </div>
      {err && <div className="err" style={{ marginTop: 4 }}>{err}</div>}
    </label>
  )
}

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

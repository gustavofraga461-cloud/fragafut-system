const express = require('express')
const http = require('http')
const cors = require('cors')
const path = require('path')
const { Server } = require('socket.io')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const db = require('./db')
require('./seed') // garante as contas de admin/organizador mesmo sem acesso a Shell
const { signToken, authRequired, roles, optionalAuth, publicUser, getUserById } = require('./auth')
const { computeStandings, computeScorers, computeCards, matchWithTeams } = require('./standings')

const PORT = process.env.PORT || 3001
const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: true } })

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '6mb' }))

function slugify(text) {
  return String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'campeonato'
}

function uniqueSlug(base) {
  let slug = slugify(base)
  let i = 1
  while (db.prepare('SELECT id FROM championships WHERE slug = ?').get(slug)) {
    slug = `${slugify(base)}-${++i}`
  }
  return slug
}

function emitMatch(matchId) {
  const match = matchWithTeams(db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId))
  if (!match) return
  io.to(`match:${matchId}`).emit('match:update', match)
  io.to(`champ:${match.championship_id}`).emit('champ:update', { championshipId: match.championship_id })
  io.emit('live:update', { matchId, championshipId: match.championship_id })
}

function statsSummary() {
  return {
    championships: db.prepare('SELECT COUNT(*) AS n FROM championships').get().n,
    teams: db.prepare('SELECT COUNT(*) AS n FROM teams').get().n,
    players: db.prepare('SELECT COUNT(*) AS n FROM players').get().n,
    matches: db.prepare('SELECT COUNT(*) AS n FROM matches').get().n,
    live: db.prepare("SELECT COUNT(*) AS n FROM matches WHERE status = 'live'").get().n,
    users: db.prepare('SELECT COUNT(*) AS n FROM users').get().n
  }
}

/* ---------- Auth ---------- */
// Não existe cadastro público: o site é de livre visualização para o público
// (artilharia, tabelas, jogos etc. sem login). Só Administrador e Organizador
// possuem conta, e essas contas só podem ser criadas por um Administrador
// já autenticado (ver POST /api/users abaixo).
app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body || {}
  if (!login || !password) return res.status(400).json({ error: 'Informe usuário/e-mail e senha' })
  const key = String(login).toLowerCase().trim()
  const row = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(key, key)
  if (!row || !bcrypt.compareSync(String(password), row.password_hash)) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }
  const user = publicUser(row)
  res.json({ token: signToken(user), user })
})

app.get('/api/auth/me', authRequired, (req, res) => {
  const user = publicUser(getUserById(req.user.id))
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' })
  res.json({ user })
})

app.post('/api/auth/forgot', (req, res) => {
  const { login } = req.body || {}
  if (!login) return res.status(400).json({ error: 'Informe usuário ou e-mail' })
  const key = String(login).toLowerCase().trim()
  const row = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(key, key)
  if (!row) {
    return res.json({ ok: true, message: 'Se a conta existir, um código foi gerado.' })
  }
  const token = crypto.randomBytes(3).toString('hex').toUpperCase()
  const expires = Date.now() + 30 * 60 * 1000
  db.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?').run(token, expires, row.id)
  res.json({
    ok: true,
    message: 'Código de recuperação gerado. Use-o para redefinir a senha.',
    demo_code: token
  })
})

app.post('/api/auth/reset', (req, res) => {
  const { login, token, password } = req.body || {}
  if (!login || !token || !password) return res.status(400).json({ error: 'Preencha todos os campos' })
  if (String(password).length < 4) return res.status(400).json({ error: 'Senha muito curta' })
  const key = String(login).toLowerCase().trim()
  const row = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(key, key)
  if (!row || !row.reset_token || row.reset_token !== String(token).toUpperCase().trim()) {
    return res.status(400).json({ error: 'Código inválido' })
  }
  if (!row.reset_expires || Date.now() > row.reset_expires) {
    return res.status(400).json({ error: 'Código expirado' })
  }
  const hash = bcrypt.hashSync(String(password), 10)
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?').run(hash, row.id)
  res.json({ ok: true })
})

/* ---------- Users (admin) ---------- */
// Somente o Administrador pode criar novas contas (Administrador ou
// Organizador). Não há papel "viewer": o público acessa tudo sem login.
app.post('/api/users', authRequired, roles('admin'), (req, res) => {
  const { name, email, username, password, role } = req.body || {}
  if (!name || !email || !username || !password || !role) {
    return res.status(400).json({ error: 'Preencha nome, e-mail, usuário, senha e papel' })
  }
  if (!['admin', 'organizer'].includes(role)) {
    return res.status(400).json({ error: 'Papel inválido. Use administrador ou organizador' })
  }
  if (String(password).length < 4) return res.status(400).json({ error: 'Senha muito curta' })
  const exists = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(
    String(email).toLowerCase().trim(),
    String(username).toLowerCase().trim()
  )
  if (exists) return res.status(409).json({ error: 'E-mail ou usuário já cadastrado' })
  const hash = bcrypt.hashSync(String(password), 10)
  const info = db.prepare(`
    INSERT INTO users (name, email, username, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(name.trim(), String(email).toLowerCase().trim(), String(username).toLowerCase().trim(), hash, role)
  res.json(publicUser(getUserById(info.lastInsertRowid)))
})

app.get('/api/users', authRequired, roles('admin'), (_req, res) => {
  const users = db.prepare('SELECT id, name, email, username, role, created_at FROM users ORDER BY id').all()
  res.json(users)
})

app.patch('/api/users/:id', authRequired, roles('admin'), (req, res) => {
  const user = getUserById(req.params.id)
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
  const { name, role } = req.body || {}
  if (role && !['admin', 'organizer'].includes(role)) {
    return res.status(400).json({ error: 'Papel inválido' })
  }
  db.prepare('UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role) WHERE id = ?')
    .run(name || null, role || null, user.id)
  res.json(publicUser(getUserById(user.id)))
})

/* ---------- Championships ---------- */
app.get('/api/championships', optionalAuth, (_req, res) => {
  const rows = db.prepare(`
    SELECT c.*, u.name AS creator_name,
      (SELECT COUNT(*) FROM teams t WHERE t.championship_id = c.id) AS teams_count,
      (SELECT COUNT(*) FROM matches m WHERE m.championship_id = c.id) AS matches_count
    FROM championships c
    LEFT JOIN users u ON u.id = c.created_by
    ORDER BY c.id DESC
  `).all()
  res.json(rows)
})

app.get('/api/championships/:id', (req, res) => {
  const key = req.params.id
  const c = db.prepare(`
    SELECT c.*, u.name AS creator_name
    FROM championships c
    LEFT JOIN users u ON u.id = c.created_by
    WHERE c.id = ? OR c.slug = ?
  `).get(key, key)
  if (!c) return res.status(404).json({ error: 'Campeonato não encontrado' })
  const teams = db.prepare('SELECT * FROM teams WHERE championship_id = ? ORDER BY name').all(c.id)
  const matches = db.prepare('SELECT * FROM matches WHERE championship_id = ? ORDER BY scheduled_at').all(c.id)
    .map(matchWithTeams)
  res.json({
    ...c,
    teams,
    matches,
    standings: computeStandings(c.id),
    scorers: computeScorers(c.id),
    cards: computeCards(c.id)
  })
})

app.post('/api/championships', authRequired, roles('admin', 'organizer'), (req, res) => {
  const { name, season, description, venue, start_date, end_date, status, logo } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' })
  const slug = uniqueSlug(name)
  const st = ['draft', 'ongoing', 'finished'].includes(status) ? status : 'draft'
  const info = db.prepare(`
    INSERT INTO championships (name, season, description, venue, start_date, end_date, status, slug, created_by, logo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name.trim(), season || null, description || null, venue || null, start_date || null, end_date || null, st, slug, req.user.id, logo || null)
  res.json(db.prepare('SELECT * FROM championships WHERE id = ?').get(info.lastInsertRowid))
})

app.patch('/api/championships/:id', authRequired, roles('admin', 'organizer'), (req, res) => {
  const c = db.prepare('SELECT * FROM championships WHERE id = ?').get(req.params.id)
  if (!c) return res.status(404).json({ error: 'Campeonato não encontrado' })
  const { name, season, description, venue, start_date, end_date, status, logo } = req.body || {}
  const st = status && ['draft', 'ongoing', 'finished'].includes(status) ? status : c.status
  db.prepare(`
    UPDATE championships SET
      name = COALESCE(?, name),
      season = COALESCE(?, season),
      description = COALESCE(?, description),
      venue = COALESCE(?, venue),
      start_date = COALESCE(?, start_date),
      end_date = COALESCE(?, end_date),
      status = ?,
      logo = COALESCE(?, logo)
    WHERE id = ?
  `).run(name || null, season || null, description || null, venue || null, start_date || null, end_date || null, st, logo || null, c.id)
  res.json(db.prepare('SELECT * FROM championships WHERE id = ?').get(c.id))
})

app.get('/api/championships/:id/standings', (req, res) => {
  const c = db.prepare('SELECT * FROM championships WHERE id = ? OR slug = ?').get(req.params.id, req.params.id)
  if (!c) return res.status(404).json({ error: 'Campeonato não encontrado' })
  res.json(computeStandings(c.id))
})

app.get('/api/championships/:id/scorers', (req, res) => {
  const c = db.prepare('SELECT * FROM championships WHERE id = ? OR slug = ?').get(req.params.id, req.params.id)
  if (!c) return res.status(404).json({ error: 'Campeonato não encontrado' })
  res.json(computeScorers(c.id))
})

app.get('/api/championships/:id/cards', (req, res) => {
  const c = db.prepare('SELECT * FROM championships WHERE id = ? OR slug = ?').get(req.params.id, req.params.id)
  if (!c) return res.status(404).json({ error: 'Campeonato não encontrado' })
  res.json(computeCards(c.id))
})

/* ---------- Teams ---------- */
app.get('/api/teams', (req, res) => {
  const { championship_id } = req.query
  let rows
  if (championship_id) {
    rows = db.prepare(`
      SELECT t.*, c.name AS championship_name,
        (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) AS players_count
      FROM teams t JOIN championships c ON c.id = t.championship_id
      WHERE t.championship_id = ?
      ORDER BY t.name
    `).all(championship_id)
  } else {
    rows = db.prepare(`
      SELECT t.*, c.name AS championship_name,
        (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) AS players_count
      FROM teams t JOIN championships c ON c.id = t.championship_id
      ORDER BY t.id DESC
    `).all()
  }
  res.json(rows)
})

app.get('/api/teams/:id', (req, res) => {
  const t = db.prepare(`
    SELECT t.*, c.name AS championship_name, c.slug AS championship_slug
    FROM teams t JOIN championships c ON c.id = t.championship_id
    WHERE t.id = ?
  `).get(req.params.id)
  if (!t) return res.status(404).json({ error: 'Time não encontrado' })
  const players = db.prepare('SELECT * FROM players WHERE team_id = ? ORDER BY number').all(t.id)
  res.json({ ...t, players })
})

app.post('/api/teams', authRequired, roles('admin', 'organizer'), (req, res) => {
  const { championship_id, name, short_name, coach, color, crest } = req.body || {}
  if (!championship_id || !name) return res.status(400).json({ error: 'Campeonato e nome obrigatórios' })
  const info = db.prepare(`
    INSERT INTO teams (championship_id, name, short_name, coach, color, crest)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(championship_id, name.trim(), short_name || null, coach || null, color || '#C41E3A', crest || null)
  res.json(db.prepare('SELECT * FROM teams WHERE id = ?').get(info.lastInsertRowid))
})

app.patch('/api/teams/:id', authRequired, roles('admin', 'organizer'), (req, res) => {
  const t = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id)
  if (!t) return res.status(404).json({ error: 'Time não encontrado' })
  const { name, short_name, coach, color, crest } = req.body || {}
  db.prepare(`
    UPDATE teams SET
      name = COALESCE(?, name),
      short_name = COALESCE(?, short_name),
      coach = COALESCE(?, coach),
      color = COALESCE(?, color),
      crest = COALESCE(?, crest)
    WHERE id = ?
  `).run(name || null, short_name || null, coach || null, color || null, crest || null, t.id)
  res.json(db.prepare('SELECT * FROM teams WHERE id = ?').get(t.id))
})

/* ---------- Players ---------- */
app.get('/api/players', (req, res) => {
  const { team_id } = req.query
  let rows
  if (team_id) {
    rows = db.prepare(`
      SELECT p.*, t.name AS team_name, t.crest
      FROM players p JOIN teams t ON t.id = p.team_id
      WHERE p.team_id = ?
      ORDER BY p.number
    `).all(team_id)
  } else {
    rows = db.prepare(`
      SELECT p.*, t.name AS team_name, t.crest
      FROM players p JOIN teams t ON t.id = p.team_id
      ORDER BY p.id DESC
    `).all()
  }
  res.json(rows)
})

app.post('/api/players', authRequired, roles('admin', 'organizer'), (req, res) => {
  const { team_id, name, nickname, number, position } = req.body || {}
  if (!team_id || !name || number == null || !position) {
    return res.status(400).json({ error: 'Time, nome, número e posição obrigatórios' })
  }
  if (!['Goleiro', 'Fixo', 'Ala', 'Pivô'].includes(position)) {
    return res.status(400).json({ error: 'Posição inválida' })
  }
  const info = db.prepare(`
    INSERT INTO players (team_id, name, nickname, number, position)
    VALUES (?, ?, ?, ?, ?)
  `).run(team_id, name.trim(), nickname || null, Number(number), position)
  res.json(db.prepare('SELECT * FROM players WHERE id = ?').get(info.lastInsertRowid))
})

app.patch('/api/players/:id', authRequired, roles('admin', 'organizer'), (req, res) => {
  const p = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id)
  if (!p) return res.status(404).json({ error: 'Jogador não encontrado' })
  const { name, nickname, number, position } = req.body || {}
  if (position && !['Goleiro', 'Fixo', 'Ala', 'Pivô'].includes(position)) {
    return res.status(400).json({ error: 'Posição inválida' })
  }
  db.prepare(`
    UPDATE players SET
      name = COALESCE(?, name),
      nickname = COALESCE(?, nickname),
      number = COALESCE(?, number),
      position = COALESCE(?, position)
    WHERE id = ?
  `).run(name || null, nickname || null, number != null ? Number(number) : null, position || null, p.id)
  res.json(db.prepare('SELECT * FROM players WHERE id = ?').get(p.id))
})

/* ---------- Matches ---------- */
app.get('/api/matches', (req, res) => {
  const { championship_id, status } = req.query
  let sql = 'SELECT * FROM matches WHERE 1=1'
  const params = []
  if (championship_id) { sql += ' AND championship_id = ?'; params.push(championship_id) }
  if (status) { sql += ' AND status = ?'; params.push(status) }
  sql += ' ORDER BY scheduled_at'
  const rows = db.prepare(sql).all(...params).map(matchWithTeams)
  res.json(rows)
})

app.get('/api/matches/:id', (req, res) => {
  const m = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id)
  if (!m) return res.status(404).json({ error: 'Partida não encontrada' })
  res.json(matchWithTeams(m))
})

app.post('/api/matches', authRequired, roles('admin', 'organizer'), (req, res) => {
  const { championship_id, home_team_id, away_team_id, round, scheduled_at, venue } = req.body || {}
  if (!championship_id || !home_team_id || !away_team_id || !scheduled_at) {
    return res.status(400).json({ error: 'Campeonato, times e data/hora obrigatórios' })
  }
  if (Number(home_team_id) === Number(away_team_id)) {
    return res.status(400).json({ error: 'Times devem ser diferentes' })
  }
  const info = db.prepare(`
    INSERT INTO matches (championship_id, home_team_id, away_team_id, round, scheduled_at, venue)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(championship_id, home_team_id, away_team_id, Number(round) || 1, scheduled_at, venue || null)
  res.json(matchWithTeams(db.prepare('SELECT * FROM matches WHERE id = ?').get(info.lastInsertRowid)))
})

app.patch('/api/matches/:id', authRequired, roles('admin', 'organizer'), (req, res) => {
  const m = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id)
  if (!m) return res.status(404).json({ error: 'Partida não encontrada' })
  const { round, scheduled_at, venue, status } = req.body || {}
  const st = status && ['scheduled', 'live', 'finished'].includes(status) ? status : m.status
  db.prepare(`
    UPDATE matches SET
      round = COALESCE(?, round),
      scheduled_at = COALESCE(?, scheduled_at),
      venue = COALESCE(?, venue),
      status = ?
    WHERE id = ?
  `).run(round != null ? Number(round) : null, scheduled_at || null, venue || null, st, m.id)
  emitMatch(m.id)
  res.json(matchWithTeams(db.prepare('SELECT * FROM matches WHERE id = ?').get(m.id)))
})

app.post('/api/matches/:id/start', authRequired, roles('admin', 'organizer'), (req, res) => {
  const m = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id)
  if (!m) return res.status(404).json({ error: 'Partida não encontrada' })
  db.prepare("UPDATE matches SET status = 'live' WHERE id = ?").run(m.id)
  emitMatch(m.id)
  res.json(matchWithTeams(db.prepare('SELECT * FROM matches WHERE id = ?').get(m.id)))
})

app.post('/api/matches/:id/finish', authRequired, roles('admin', 'organizer'), (req, res) => {
  const m = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id)
  if (!m) return res.status(404).json({ error: 'Partida não encontrada' })
  db.prepare("UPDATE matches SET status = 'finished' WHERE id = ?").run(m.id)
  emitMatch(m.id)
  res.json(matchWithTeams(db.prepare('SELECT * FROM matches WHERE id = ?').get(m.id)))
})

app.post('/api/matches/:id/events', authRequired, roles('admin', 'organizer'), (req, res) => {
  const m = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id)
  if (!m) return res.status(404).json({ error: 'Partida não encontrada' })
  if (m.status === 'scheduled') {
    db.prepare("UPDATE matches SET status = 'live' WHERE id = ?").run(m.id)
  }
  const { type, team_id, player_id, player_out_id, minute } = req.body || {}
  if (!['goal', 'yellow', 'red', 'sub'].includes(type)) {
    return res.status(400).json({ error: 'Tipo de evento inválido' })
  }
  if (!team_id) return res.status(400).json({ error: 'Time obrigatório' })
  const info = db.prepare(`
    INSERT INTO events (match_id, type, team_id, player_id, player_out_id, minute)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(m.id, type, team_id, player_id || null, player_out_id || null, Number(minute) || 0)

  if (type === 'goal') {
    if (Number(team_id) === m.home_team_id) {
      db.prepare('UPDATE matches SET home_score = home_score + 1 WHERE id = ?').run(m.id)
    } else if (Number(team_id) === m.away_team_id) {
      db.prepare('UPDATE matches SET away_score = away_score + 1 WHERE id = ?').run(m.id)
    }
  }

  emitMatch(m.id)
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(info.lastInsertRowid)
  res.json({ event, match: matchWithTeams(db.prepare('SELECT * FROM matches WHERE id = ?').get(m.id)) })
})

/* ---------- Dashboard ---------- */
app.get('/api/dashboard', optionalAuth, (_req, res) => {
  const live = db.prepare("SELECT * FROM matches WHERE status = 'live' ORDER BY scheduled_at").all().map(matchWithTeams)
  const upcoming = db.prepare(`
    SELECT * FROM matches WHERE status = 'scheduled' AND datetime(scheduled_at) >= datetime('now','-1 day')
    ORDER BY scheduled_at LIMIT 8
  `).all().map(matchWithTeams)
  const recent = db.prepare(`
    SELECT * FROM matches WHERE status = 'finished' ORDER BY scheduled_at DESC LIMIT 8
  `).all().map(matchWithTeams)
  const championships = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM teams t WHERE t.championship_id = c.id) AS teams_count
    FROM championships c ORDER BY c.id DESC LIMIT 6
  `).all()
  res.json({ stats: statsSummary(), live, upcoming, recent, championships })
})

io.on('connection', (socket) => {
  socket.on('join:match', (id) => { if (id) socket.join(`match:${id}`) })
  socket.on('leave:match', (id) => { if (id) socket.leave(`match:${id}`) })
  socket.on('join:champ', (id) => { if (id) socket.join(`champ:${id}`) })
  socket.on('leave:champ', (id) => { if (id) socket.leave(`champ:${id}`) })
})

const clientDist = path.join(__dirname, '..', 'client', 'dist')
app.use(express.static(clientDist))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next()
  const index = path.join(clientDist, 'index.html')
  res.sendFile(index, (err) => { if (err) next() })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`FRAGAFUT API em http://0.0.0.0:${PORT}`)
})

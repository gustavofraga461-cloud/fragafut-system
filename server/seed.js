// Seed inicial do FRAGAFUT.
// Cria apenas as contas de acesso (Administrador e Organizador).
// Nenhum campeonato, time, jogador ou partida de exemplo é criado:
// o sistema começa "zerado" e o Administrador/Organizador cadastra
// tudo pelo painel administrativo.

const bcrypt = require('bcryptjs')
const db = require('./db')

const hash = (p) => bcrypt.hashSync(p, 10)

const users = [
  ['Administrador FRAGAFUT', 'admin@fragafut.com', 'admin', hash('admin123'), 'admin'],
  ['Organizador FRAGAFUT', 'organizador@fragafut.com', 'organizador', hash('org123'), 'organizer']
]

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, username, password_hash, role) VALUES (?, ?, ?, ?, ?)
`)

const countUsers = db.prepare('SELECT COUNT(*) AS n FROM users').get().n
if (countUsers === 0) {
  for (const u of users) insertUser.run(...u)
  console.log('Seed FRAGAFUT concluído: contas de acesso criadas.')
  console.log('Administrador -> usuário: admin / senha: admin123')
  console.log('Organizador   -> usuário: organizador / senha: org123')
  console.log('IMPORTANTE: troque essas senhas no primeiro acesso.')
  console.log('Nenhum campeonato, time ou jogador foi criado — cadastre tudo pelo Painel.')
} else {
  console.log('Banco já possui usuários. Seed ignorado (nada foi alterado).')
}

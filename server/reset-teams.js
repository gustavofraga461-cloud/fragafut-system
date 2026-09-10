// Zera todos os times cadastrados (e, por consequência, jogadores,
// partidas e eventos ligados a eles, via ON DELETE CASCADE).
// Não mexe em usuários nem nos campeonatos criados.
// Uso: npm run reset:teams

const db = require('./db')

const before = db.prepare('SELECT COUNT(*) AS n FROM teams').get().n
db.prepare('DELETE FROM teams').run()
db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('teams','players','matches','events')").run()

console.log(`Times zerados: ${before} time(s) removido(s) (jogadores, partidas e eventos vinculados também foram apagados).`)
console.log('Os campeonatos continuam cadastrados. Agora é só o Administrador/Organizador adicionar os times novos pelo Painel.')

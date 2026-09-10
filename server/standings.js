const db = require('./db')

function computeStandings(championshipId) {
  const teams = db.prepare('SELECT * FROM teams WHERE championship_id = ? ORDER BY name').all(championshipId)
  const matches = db.prepare(`
    SELECT * FROM matches
    WHERE championship_id = ? AND status = 'finished'
  `).all(championshipId)

  const table = new Map()
  for (const t of teams) {
    table.set(t.id, {
      team_id: t.id,
      team_name: t.name,
      short_name: t.short_name,
      crest: t.crest,
      color: t.color,
      pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0
    })
  }

  for (const m of matches) {
    const home = table.get(m.home_team_id)
    const away = table.get(m.away_team_id)
    if (!home || !away) continue
    home.j += 1
    away.j += 1
    home.gp += m.home_score
    home.gc += m.away_score
    away.gp += m.away_score
    away.gc += m.home_score
    if (m.home_score > m.away_score) {
      home.v += 1
      home.pts += 3
      away.d += 1
    } else if (m.home_score < m.away_score) {
      away.v += 1
      away.pts += 3
      home.d += 1
    } else {
      home.e += 1
      away.e += 1
      home.pts += 1
      away.pts += 1
    }
  }

  const rows = [...table.values()].map((r) => {
    r.sg = r.gp - r.gc
    return r
  })

  rows.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.sg !== a.sg) return b.sg - a.sg
    if (b.gp !== a.gp) return b.gp - a.gp
    return a.team_name.localeCompare(b.team_name, 'pt-BR')
  })

  return rows.map((r, i) => ({ ...r, position: i + 1 }))
}

function computeScorers(championshipId) {
  return db.prepare(`
    SELECT
      p.id AS player_id,
      p.name,
      p.nickname,
      p.number,
      p.position,
      t.id AS team_id,
      t.name AS team_name,
      t.crest,
      COUNT(*) AS goals
    FROM events e
    JOIN matches m ON m.id = e.match_id
    JOIN players p ON p.id = e.player_id
    JOIN teams t ON t.id = p.team_id
    WHERE m.championship_id = ? AND e.type = 'goal' AND e.player_id IS NOT NULL
    GROUP BY p.id
    ORDER BY goals DESC, p.name ASC
  `).all(championshipId)
}

function computeCards(championshipId) {
  return db.prepare(`
    SELECT
      p.id AS player_id,
      p.name,
      p.nickname,
      p.number,
      p.position,
      t.id AS team_id,
      t.name AS team_name,
      t.crest,
      SUM(CASE WHEN e.type = 'yellow' THEN 1 ELSE 0 END) AS yellow,
      SUM(CASE WHEN e.type = 'red' THEN 1 ELSE 0 END) AS red
    FROM events e
    JOIN matches m ON m.id = e.match_id
    JOIN players p ON p.id = e.player_id
    JOIN teams t ON t.id = p.team_id
    WHERE m.championship_id = ? AND e.type IN ('yellow','red') AND e.player_id IS NOT NULL
    GROUP BY p.id
    HAVING yellow > 0 OR red > 0
    ORDER BY red DESC, yellow DESC, p.name ASC
  `).all(championshipId)
}

function matchWithTeams(match) {
  if (!match) return null
  const home = db.prepare('SELECT * FROM teams WHERE id = ?').get(match.home_team_id)
  const away = db.prepare('SELECT * FROM teams WHERE id = ?').get(match.away_team_id)
  const events = db.prepare(`
    SELECT e.*,
      p.name AS player_name, p.nickname AS player_nickname, p.number AS player_number,
      po.name AS player_out_name, po.nickname AS player_out_nickname, po.number AS player_out_number,
      tm.name AS team_name
    FROM events e
    LEFT JOIN players p ON p.id = e.player_id
    LEFT JOIN players po ON po.id = e.player_out_id
    LEFT JOIN teams tm ON tm.id = e.team_id
    WHERE e.match_id = ?
    ORDER BY e.minute ASC, e.id ASC
  `).all(match.id)
  return { ...match, home, away, events }
}

module.exports = { computeStandings, computeScorers, computeCards, matchWithTeams }

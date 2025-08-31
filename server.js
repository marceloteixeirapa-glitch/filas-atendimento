// server.js
// Código completo do servidor (Node.js + Express + SQLite + Socket.io)
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Banco de dados SQLite
const db = new Database(path.join(__dirname, 'db.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS queues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_id INTEGER NOT NULL,
  number INTEGER NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  called_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(queue_id) REFERENCES queues(id)
);
CREATE TABLE IF NOT EXISTS counters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  queue_id INTEGER NOT NULL,
  current_ticket_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(queue_id) REFERENCES queues(id),
  FOREIGN KEY(current_ticket_id) REFERENCES tickets(id)
);
`);

// Função de estado geral
const getState = () => {
  const queues = db.prepare('SELECT * FROM queues ORDER BY id').all();
  const counters = db.prepare('SELECT * FROM counters ORDER BY id').all();
  const lastCalled = db.prepare(`
    SELECT t.*, q.name AS queue_name, c.name AS counter_name
    FROM tickets t
    LEFT JOIN queues q ON q.id = t.queue_id
    LEFT JOIN counters c ON c.current_ticket_id = t.id
    WHERE t.status IN ('called')
    ORDER BY t.called_at DESC
    LIMIT 20
  `).all();
  return { queues, counters, lastCalled };
};

const broadcast = () => io.emit('state:update', getState());

// Rotas REST
app.get('/api/state', (req, res) => res.json(getState()));

// Inicia servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
